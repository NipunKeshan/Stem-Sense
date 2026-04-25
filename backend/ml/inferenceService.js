/**
 * Stem-Sense — ML Inference Service  (v3)
 * =========================================
 * Drop into:  backend/ml/inferenceService.js
 * Alongside:  backend/ml/pump_model.onnx
 *             backend/ml/model_meta.json
 *
 * Input features (7 raw from ESP8266):
 *   temperature_c, humidity_pct, tvoc_ppb, eco2_ppm,
 *   aqi, lux, moisture_pct
 *
 * Engineered features (computed here, must match train notebook):
 *   vpd                = temperature_c * (1 - humidity_pct / 100)
 *   temp_moisture_ratio= temperature_c / (moisture_pct + 0.001)
 *   heat_load          = temperature_c * (1 - humidity_pct / 100) * (lux / 1500)
 *
 * ONNX outputs (zipmap=False):
 *   label         tensor(int64)  shape [1]     → 0 or 1
 *   probabilities tensor(float)  shape [1, 2]  → [P(OFF), P(ON)]
 */

const ort  = require("onnxruntime-node");
const path = require("path");
const meta = require("./model_meta.json");

let session = null;

async function loadModel() {
  if (session) return;
  const modelPath = path.join(__dirname, meta.model_file);
  session = await ort.InferenceSession.create(modelPath);
  console.log(`[ML] pump_model.onnx loaded  (${meta.onnx_meta.size_kb} KB)`);
  console.log(`[ML] Features: ${meta.all_features.join(", ")}`);
}

loadModel().catch((err) => {
  console.error("[ML] Failed to load ONNX model:", err.message);
});

// ── Feature engineering ─────────────────────────────────────
function engineerFeatures(raw) {
  const { temperature_c, humidity_pct, moisture_pct, lux } = raw;
  return {
    vpd:                 temperature_c * (1 - humidity_pct / 100),
    temp_moisture_ratio: temperature_c / (moisture_pct + 0.001),
    heat_load:           temperature_c * (1 - humidity_pct / 100) * (lux / 1500),
  };
}

function buildInputTensor(raw) {
  const merged = { ...raw, ...engineerFeatures(raw) };
  const values = meta.all_features.map((feat) => {
    const v = merged[feat];
    if (v === undefined || v === null || isNaN(Number(v))) {
      throw new Error(`[ML] Missing or invalid feature: "${feat}"`);
    }
    return Number(v);
  });
  return new Float32Array(values);
}

/**
 * getPumpDecision(sensorData)
 * @param  {Object} sensorData  raw sensor fields from request body
 * @returns {Promise<{ pump_state: number, confidence: number }>}
 */
async function getPumpDecision(sensorData) {
  if (!session) await loadModel();

  const inputArray  = buildInputTensor(sensorData);
  const inputTensor = new ort.Tensor("float32", inputArray, [1, meta.all_features.length]);
  const feeds       = { [meta.onnx_meta.input_name]: inputTensor };

  const results = await session.run(feeds);

  // label → tensor(int64), shape [1]
  const pump_state = Number(results[meta.onnx_meta.label_name].data[0]);

  // probabilities → tensor(float), shape [1,2] — pump_state indexes directly
  const probData   = results[meta.onnx_meta.prob_name].data;
  const confidence = Number(probData[pump_state]);

  console.log(
    `[ML] decision=PUMP ${pump_state ? "ON" : "OFF"}  ` +
    `confidence=${(confidence * 100).toFixed(1)}%`
  );

  return {
    pump_state,
    confidence: Math.round(confidence * 10000) / 10000,
  };
}

module.exports = { getPumpDecision };
