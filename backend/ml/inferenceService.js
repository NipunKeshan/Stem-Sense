/**
 * Stem-Sense — ML Inference Service  (v2 — zipmap:false fix)
 * ============================================================
 * Drop into:  backend/ml/inferenceService.js
 * Alongside:  backend/ml/pump_model.onnx   (re-exported with zipmap:false)
 *             backend/ml/model_meta.json
 *
 * Fix: onnxruntime-node does not support ZipMap output (the {0:p0,1:p1}
 * map type). The model is now exported with  options={zipmap:False}  so
 * the probability output is a plain float32 tensor of shape [1, 2].
 * Index 0 = P(pump OFF), Index 1 = P(pump ON).
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

// ── Feature engineering — must match train.py exactly ──────────
function engineerFeatures(raw) {
  const { temperature, humidity, soil_moisture, lux } = raw;
  return {
    vpd:             temperature * (1 - humidity / 100),
    temp_soil_ratio: temperature / (soil_moisture + 0.001),
    heat_load:       temperature * (1 - humidity / 100) * (lux / 1500),
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
 *
 * @param  {Object} sensorData — raw sensor fields from request body
 * @returns {Promise<{ pump_state: number, confidence: number }>}
 */
async function getPumpDecision(sensorData) {
  if (!session) await loadModel();

  const inputArray  = buildInputTensor(sensorData);
  const inputTensor = new ort.Tensor("float32", inputArray, [1, meta.all_features.length]);
  const feeds       = { [meta.onnx_meta.input_name]: inputTensor };

  const results = await session.run(feeds);

  // ── Label: tensor(int64), shape [1] ────────────────────────
  const pump_state = Number(results[meta.onnx_meta.label_name].data[0]);

  // ── Probabilities: tensor(float), shape [1, 2] ─────────────
  // data is a flat Float32Array: [P(class_0), P(class_1)]
  // pump_state is 0 or 1, so it directly indexes into the array
  const probData   = results[meta.onnx_meta.prob_name].data;
  const confidence = Number(probData[pump_state]);   // probability of the predicted class

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
