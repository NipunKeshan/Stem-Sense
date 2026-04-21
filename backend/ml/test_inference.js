/**
 * Stem-Sense — ML Inference Test
 * ================================
 * Run this BEFORE integrating with the live server to verify
 * the ONNX model loads and produces correct decisions.
 *
 * Usage:
 *   cd backend
 *   node ml/test_inference.js
 *
 * No MongoDB connection required.
 */

const { getPumpDecision } = require("./inferenceService");

// ── Test cases ────────────────────────────────────────────────
// These cover the key scenarios your controller will encounter
const testCases = [
  {
    label: "HOT + DRY SOIL  →  expect PUMP ON",
    data:  { temperature: 33, humidity: 42, tvoc: 180, eco2: 430, aqi: 65, lux: 1200, dli: 4.5, soil_moisture: 32 },
    expect: 1,
  },
  {
    label: "COOL + WET SOIL  →  expect PUMP OFF",
    data:  { temperature: 18, humidity: 78, tvoc: 110, eco2: 405, aqi: 25, lux: 200,  dli: 0.8, soil_moisture: 72 },
    expect: 0,
  },
  {
    label: "MODERATE CONDITIONS  →  model decides",
    data:  { temperature: 25, humidity: 60, tvoc: 150, eco2: 420, aqi: 45, lux: 700,  dli: 2.8, soil_moisture: 55 },
    expect: null,   // no strict expectation — just log the output
  },
  {
    label: "EDGE — night time (lux=0, dli=0)",
    data:  { temperature: 20, humidity: 70, tvoc: 130, eco2: 410, aqi: 30, lux: 0,    dli: 0.0, soil_moisture: 48 },
    expect: null,
  },
  {
    label: "EDGE — max temperature + min soil",
    data:  { temperature: 35, humidity: 41, tvoc: 245, eco2: 448, aqi: 79, lux: 1490, dli: 5.9, soil_moisture: 31 },
    expect: 1,
  },
];

// ── Run ───────────────────────────────────────────────────────
async function runTests() {
  console.log("\n" + "=".repeat(60));
  console.log("  Stem-Sense  —  ML Inference Tests");
  console.log("=".repeat(60));

  let passed = 0;
  let total  = testCases.filter((t) => t.expect !== null).length;

  for (const tc of testCases) {
    try {
      const { pump_state, confidence } = await getPumpDecision(tc.data);
      const label   = pump_state === 1 ? "PUMP ON " : "PUMP OFF";
      const confPct = (confidence * 100).toFixed(1);

      let resultTag = "       ";
      if (tc.expect !== null) {
        const ok = pump_state === tc.expect;
        resultTag = ok ? "  ✅    " : "  ❌    ";
        if (ok) passed++;
      }

      console.log(`\n  ${tc.label}`);
      console.log(`  ${resultTag}→  ${label}  (confidence: ${confPct}%)`);
      if (tc.expect !== null && pump_state !== tc.expect) {
        console.log(`           Expected: ${tc.expect === 1 ? "PUMP ON" : "PUMP OFF"}`);
      }
    } catch (err) {
      console.log(`\n  ${tc.label}`);
      console.log(`  ❌  ERROR: ${err.message}`);
    }
  }

  console.log("\n" + "-".repeat(60));
  console.log(`  Strict tests: ${passed}/${total} passed`);
  console.log("  (cases with expect=null are informational only)");
  console.log("=".repeat(60) + "\n");
}

runTests();
