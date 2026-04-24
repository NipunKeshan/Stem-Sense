"""
Stem-Sense ML Service  —  Flask microservice
Runs on port 5001.  Node backend proxies to this.

Endpoints:
  GET /health
  GET /forecast          →  30-day stress forecast
  GET /correlation       →  feature importance + scatter data
  GET /model-info        →  metadata about the loaded model
"""

import os
import json
import joblib
import traceback

import numpy as np
import pandas as pd
from flask import Flask, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# ── App setup ──────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

# ── Config ─────────────────────────────────────────────────────────────────
MONGO_URI  = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/stemsense')
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'stress_forecast_best_model.pkl')
META_PATH  = os.path.join(os.path.dirname(__file__), 'models', 'model_metadata.json')

FEATURE_COLS = [
    'temperature_c', 'humidity_pct', 'moisture_pct',
    'lux', 'tvoc_ppb', 'eco2_ppm', 'aqi', 'stress_score'
]

# Stress zone boundaries
ZONES = {
    'healthy':  (0,  30),
    'warning':  (31, 60),
    'critical': (61, 100),
}


# ── Load model once at startup ─────────────────────────────────────────────
def load_model():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model not found at: {MODEL_PATH}")
    model = joblib.load(MODEL_PATH)
    print(f"✅  Model loaded from {MODEL_PATH}")
    return model

def load_metadata():
    if not os.path.exists(META_PATH):
        return {}
    with open(META_PATH) as f:
        return json.load(f)

try:
    MODEL    = load_model()
    METADATA = load_metadata()
    print(f"✅  Model type : {METADATA.get('model_name', 'Unknown')}")
    print(f"    R²         : {METADATA.get('metrics', {}).get('r2_test', 'N/A')}")
    print(f"    MAE        : {METADATA.get('metrics', {}).get('mae', 'N/A')}")
except Exception as e:
    print(f"❌  Failed to load model: {e}")
    MODEL    = None
    METADATA = {}


# ── Helpers ────────────────────────────────────────────────────────────────
def classify_zone(score: float) -> str:
    if score <= 30:   return 'healthy'
    elif score <= 60: return 'warning'
    return 'critical'


def compute_stress_score(row: dict) -> float:
    """
    Compute a current stress score (0-100) from raw sensor values.
    This mirrors the labelling logic used when building the dataset.
    """
    score = 0.0

    # Temperature stress
    temp = row.get('temperature_c', 25)
    if temp > 38:   score += 30
    elif temp > 35: score += 20
    elif temp > 32: score += 10

    # Humidity stress (too low = bad for most plants)
    hum = row.get('humidity_pct', 50)
    if hum < 30:   score += 30
    elif hum < 40: score += 15

    # Soil moisture stress
    moist = row.get('moisture_pct', 50)
    if moist < 20:   score += 30
    elif moist < 35: score += 15

    # Air quality stress
    tvoc = row.get('tvoc_ppb', 0)
    if tvoc > 300: score += 10
    elif tvoc > 200: score += 5

    return min(round(score, 2), 100.0)


def fetch_latest_readings(n: int = 30) -> pd.DataFrame:
    """Pull the last n sensor readings from MongoDB and flatten them."""
    client = MongoClient(MONGO_URI)
    db     = client.get_default_database()

    docs = list(
        db.sensordata
          .find({}, {'_id': 0, 'env': 1, 'soil': 1, 'captured_at': 1})
          .sort('captured_at', -1)
          .limit(n)
    )
    client.close()

    if not docs:
        return pd.DataFrame()

    rows = []
    for d in docs:
        env  = d.get('env',  {})
        soil = d.get('soil', {})
        rows.append({
            'temperature_c': env.get('temperature_c', 25.0),
            'humidity_pct':  env.get('humidity_pct',  50.0),
            'moisture_pct':  soil.get('moisture_pct', 40.0),
            'lux':           env.get('lux',       0.0),
            'tvoc_ppb':      env.get('tvoc_ppb',  100.0),
            'eco2_ppm':      env.get('eco2_ppm',  400.0),
            'aqi':           env.get('aqi',        20.0),
        })

    df = pd.DataFrame(rows)
    df['stress_score'] = df.apply(lambda r: compute_stress_score(r.to_dict()), axis=1)
    return df


# ── Routes ─────────────────────────────────────────────────────────────────

@app.route('/health')
def health():
    return jsonify({
        'status': 'ok',
        'model_loaded': MODEL is not None,
        'model_name':   METADATA.get('model_name', 'Unknown'),
    })


@app.route('/model-info')
def model_info():
    return jsonify({
        'success':  True,
        'metadata': METADATA,
    })


@app.route('/forecast')
def forecast():
    """
    Returns a 30-day iterative stress forecast.

    Strategy:
      1. Fetch the most recent sensor reading from MongoDB.
      2. Use it as Day-0 state.
      3. For each of Day 1–30:
           - Feed current state into the Linear Regression pipeline.
           - Predicted value becomes next 'stress_score' input.
      4. Return the day-by-day predictions + zone labels.
    """
    if MODEL is None:
        return jsonify({'error': 'Model not loaded'}), 500

    try:
        df = fetch_latest_readings(n=1)          # just the very latest reading

        if df.empty:
            # Fall back to a safe default if MongoDB has no data yet
            state = {col: 0.0 for col in FEATURE_COLS}
            state.update({'temperature_c': 33.0, 'humidity_pct': 55.0,
                          'moisture_pct': 35.0,  'lux': 500.0,
                          'tvoc_ppb': 150.0,     'eco2_ppm': 450.0,
                          'aqi': 25.0,           'stress_score': 50.0})
        else:
            state = df.iloc[0][FEATURE_COLS].to_dict()

        forecast_points = []
        current = dict(state)          # mutable copy

        for day in range(1, 31):
            X_input = pd.DataFrame([current])[FEATURE_COLS]
            raw_pred = float(MODEL.predict(X_input)[0])
            pred     = max(0.0, min(100.0, round(raw_pred, 2)))

            forecast_points.append({
                'day':             day,
                'predicted_stress': pred,
                'zone':            classify_zone(pred),
            })

            # Roll state forward: predicted stress feeds back as input stress
            current['stress_score'] = pred

        return jsonify({
            'success':          True,
            'model':            METADATA.get('model_name', 'Linear Regression'),
            'r2':               METADATA.get('metrics', {}).get('r2_test'),
            'mae':              METADATA.get('metrics', {}).get('mae'),
            'starting_state':   state,
            'forecast':         forecast_points,
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/correlation')
def correlation():
    """
    Returns:
      - Pearson correlation matrix between all sensor features.
      - Feature coefficients from the Linear Regression model (stand-in for importances).
      - Scatter-plot point data for three key pairs:
          Soil vs Temperature | Soil vs Humidity | Temperature vs Humidity
    """
    if MODEL is None:
        return jsonify({'error': 'Model not loaded'}), 500

    try:
        # Fetch more readings for meaningful correlation stats
        df = fetch_latest_readings(n=200)

        if df.empty:
            return jsonify({'error': 'No sensor data available in database'}), 400

        # ── Pearson correlation matrix ────────────────────────────────────
        corr_matrix = (
            df[FEATURE_COLS]
            .corr()
            .round(3)
            .to_dict()
        )

        # ── Linear Regression coefficients (= "feature importance" proxy) ─
        inner_model = MODEL.named_steps['model']          # LinearRegression

        if hasattr(inner_model, 'coef_'):
            # Normalise to 0-1 range so frontend can display as importance bars
            coefs     = inner_model.coef_
            abs_coefs = np.abs(coefs)
            norm      = abs_coefs / abs_coefs.sum() if abs_coefs.sum() > 0 else abs_coefs
            feature_importance = {
                feat: {
                    'coefficient': round(float(c), 6),
                    'importance':  round(float(n), 4),   # normalised abs value
                }
                for feat, c, n in zip(FEATURE_COLS, coefs, norm)
            }
        else:
            feature_importance = {}

        # ── Scatter data for 3 key pairs ─────────────────────────────────
        scatter_pairs = [
            ('moisture_pct',  'temperature_c', 'Soil Moisture vs Temperature'),
            ('moisture_pct',  'humidity_pct',  'Soil Moisture vs Humidity'),
            ('temperature_c', 'humidity_pct',  'Temperature vs Humidity'),
        ]

        scatter_data = []
        for x_col, y_col, label in scatter_pairs:
            pts = df[[x_col, y_col, 'stress_score']].dropna()
            scatter_data.append({
                'label':  label,
                'x_col':  x_col,
                'y_col':  y_col,
                'points': [
                    {
                        'x':      round(float(r[x_col]),      2),
                        'y':      round(float(r[y_col]),      2),
                        'stress': round(float(r['stress_score']), 2),
                        'zone':   classify_zone(float(r['stress_score'])),
                    }
                    for _, r in pts.iterrows()
                ],
            })

        return jsonify({
            'success':             True,
            'sample_count':        len(df),
            'correlation_matrix':  corr_matrix,
            'feature_importance':  feature_importance,
            'scatter_data':        scatter_data,
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ── Entry point ────────────────────────────────────────────────────────────
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
