/**
 * Stress Forecast Service
 * Uses linear regression (statistical, no ML library needed) to forecast
 * plant stress score for the next 7 or 14 days from recent sensor data.
 *
 * Stress Score Formula (0–100):
 *   Combines soil_moisture, temperature, humidity, lux, tvoc, aqi
 *   into a single stress index using weighted deviation from ideal ranges.
 */

// ─── Ideal / threshold constants ────────────────────────────────────────────
const IDEAL = {
  soil_moisture: { ideal: 60, min: 30, max: 90 },   // %
  temperature:   { ideal: 26, min: 18, max: 35 },   // °C
  humidity:      { ideal: 65, min: 40, max: 85 },   // %
  lux:           { ideal: 500, min: 100, max: 2000 },// lux
  tvoc:          { ideal: 100, min: 0,  max: 400 },  // ppb
  aqi:           { ideal: 25,  min: 0,  max: 150 },  // index
};

const WEIGHTS = {
  soil_moisture: 0.30,
  temperature:   0.20,
  humidity:      0.15,
  lux:           0.15,
  tvoc:          0.10,
  aqi:           0.10,
};

/**
 * Compute a stress score (0–100) from a single sensor reading.
 * Each metric contributes a normalised penalty (0–1) scaled by its weight.
 */
function computeStressScore(reading) {
  let score = 0;
  for (const [key, cfg] of Object.entries(IDEAL)) {
    const val = reading[key];
    if (val === undefined || val === null) continue;
    const range = cfg.max - cfg.min || 1;
    const deviation = Math.abs(val - cfg.ideal) / range; // 0–1
    score += Math.min(deviation, 1) * WEIGHTS[key] * 100;
  }
  return Math.min(Math.round(score * 10) / 10, 100);
}

/**
 * Simple Ordinary Least Squares (y = a + b*x) on an array of numbers.
 * x is the index (0,1,2,...).
 * Returns { slope, intercept }.
 */
function linearRegression(values) {
  const n = values.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - meanX) * (values[i] - meanY);
    den += (i - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  return { slope, intercept };
}

/**
 * Exponential smoothing (alpha ∈ (0,1]) — gives more weight to recent data.
 */
function exponentialSmooth(values, alpha = 0.4) {
  if (values.length === 0) return [];
  const smoothed = [values[0]];
  for (let i = 1; i < values.length; i++) {
    smoothed.push(alpha * values[i] + (1 - alpha) * smoothed[i - 1]);
  }
  return smoothed;
}

/**
 * Clamp a number between min and max.
 */
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/**
 * Label a stress score with its zone.
 */
function stressZone(score) {
  if (score <= 30) return 'Healthy';
  if (score <= 60) return 'Warning';
  return 'Critical';
}

/**
 * Main forecast function.
 *
 * @param {Array<Object>} readings  - Array of recent sensor documents from MongoDB
 *                                    (already sorted newest-first or oldest-first, we sort internally)
 * @param {number}        days      - Number of days to forecast (7 or 14, default 14)
 * @returns {Object}  forecast result
 */
function forecastStress(readings, days = 14) {
  if (!readings || readings.length === 0) {
    return { success: false, error: 'No sensor data available for forecasting.' };
  }

  // Sort oldest → newest
  const sorted = [...readings].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Compute historical stress scores
  const historicalScores = sorted.map(r => computeStressScore(r));

  // Use at most last 20 readings (requirement: works with 20 data points)
  const recent = historicalScores.slice(-20);
  const smoothed = exponentialSmooth(recent, 0.4);

  // Fit linear regression to smoothed values
  const { slope, intercept } = linearRegression(smoothed);
  const n = smoothed.length;

  // The last smoothed value is the baseline (x = n-1)
  const baseline = intercept + slope * (n - 1);

  // Project forward
  const forecast = [];
  for (let d = 1; d <= days; d++) {
    const raw = baseline + slope * d;
    const score = Math.round(clamp(raw, 0, 100) * 10) / 10;
    forecast.push({
      day: d,
      stress_score: score,
      zone: stressZone(score),
    });
  }

  // Build historical summary (last 5 readings for chart reference)
  const historicalSummary = sorted.slice(-5).map((r, i) => ({
    label: `Day -${4 - i}`,
    stress_score: historicalScores[historicalScores.length - 5 + i],
    zone: stressZone(historicalScores[historicalScores.length - 5 + i]),
    timestamp: r.timestamp,
  }));

  return {
    success: true,
    forecast_days: days,
    data_points_used: recent.length,
    trend: slope > 0.3 ? 'increasing' : slope < -0.3 ? 'decreasing' : 'stable',
    trend_slope: Math.round(slope * 100) / 100,
    current_stress: recent[recent.length - 1],
    historical: historicalSummary,
    forecast,
  };
}

module.exports = { forecastStress, computeStressScore };
