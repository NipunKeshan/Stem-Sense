/**
 * Correlation Analysis Service
 * Computes Pearson correlation coefficients between sensor pairs:
 *   - soil_moisture vs temperature
 *   - soil_moisture vs humidity
 *   - temperature vs humidity
 *   - lux vs temperature  (bonus)
 *   - tvoc vs eco2        (bonus)
 *
 * No external ML library — pure statistics (Pearson r formula).
 * Works with as few as 5 data points (designed for 20-point datasets).
 */

/**
 * Pearson correlation coefficient between two equal-length numeric arrays.
 * Returns a value in [-1, 1].
 * Returns null if arrays are too short or have zero variance.
 */
function pearsonR(xs, ys) {
  const n = xs.length;
  if (n < 3 || n !== ys.length) return null;

  const mean = arr => arr.reduce((s, v) => s + v, 0) / arr.length;
  const mx = mean(xs);
  const my = mean(ys);

  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    num  += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? null : Math.round((num / den) * 1000) / 1000;
}

/**
 * Interpret the magnitude and direction of a Pearson r value.
 */
function interpretR(r) {
  if (r === null) return { strength: 'insufficient data', direction: 'unknown' };
  const abs = Math.abs(r);
  const direction = r > 0 ? 'positive' : 'negative';
  let strength;
  if (abs >= 0.8)      strength = 'very strong';
  else if (abs >= 0.6) strength = 'strong';
  else if (abs >= 0.4) strength = 'moderate';
  else if (abs >= 0.2) strength = 'weak';
  else                 strength = 'negligible';
  return { strength, direction };
}

/**
 * Simple linear regression for scatter data (used for trendline on charts).
 * Returns { slope, intercept, r_squared }.
 */
function simpleLinearReg(xs, ys) {
  const n = xs.length;
  if (n < 2) return { slope: 0, intercept: 0, r_squared: 0 };
  const meanX = xs.reduce((s, v) => s + v, 0) / n;
  const meanY = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;

  // R² from Pearson r
  const r = pearsonR(xs, ys) ?? 0;
  const r_squared = Math.round(r * r * 1000) / 1000;

  return {
    slope: Math.round(slope * 10000) / 10000,
    intercept: Math.round(intercept * 100) / 100,
    r_squared,
  };
}

/**
 * PAIR DEFINITIONS — sensor pairs to analyse.
 * Add or remove entries here to change what's reported.
 */
const PAIRS = [
  { xKey: 'soil_moisture', yKey: 'temperature',   label: 'Soil Moisture vs Temperature' },
  { xKey: 'soil_moisture', yKey: 'humidity',       label: 'Soil Moisture vs Humidity' },
  { xKey: 'temperature',   yKey: 'humidity',       label: 'Temperature vs Humidity' },
  { xKey: 'lux',           yKey: 'temperature',    label: 'Light (lux) vs Temperature' },
  { xKey: 'tvoc',          yKey: 'eco2',            label: 'TVOC vs eCO2' },
];

/**
 * Main correlation function.
 *
 * @param {Array<Object>} readings  - Sensor documents from MongoDB
 * @returns {Object} Full correlation report
 */
function analyseCorrelations(readings) {
  if (!readings || readings.length < 3) {
    return { success: false, error: 'Need at least 3 readings for correlation analysis.' };
  }

  // Use last 20 readings (works with minimum dataset requirement)
  const data = [...readings]
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .slice(-20);

  const results = PAIRS.map(({ xKey, yKey, label }) => {
    const xs = data.map(r => r[xKey]).filter(v => v !== undefined && v !== null);
    const ys = data.map(r => r[yKey]).filter(v => v !== undefined && v !== null);

    // Pair them up (zip) — use minimum length to stay aligned
    const len = Math.min(xs.length, ys.length);
    const pxs = xs.slice(0, len);
    const pys = ys.slice(0, len);

    const r = pearsonR(pxs, pys);
    const interpretation = interpretR(r);
    const regression = simpleLinearReg(pxs, pys);

    // Build scatter data points for chart
    const scatter = pxs.map((x, i) => ({ x, y: pys[i] }));

    return {
      pair: label,
      x_axis: xKey,
      y_axis: yKey,
      pearson_r: r,
      r_squared: regression.r_squared,
      interpretation: `${interpretation.strength} ${interpretation.direction} correlation`,
      regression,          // slope & intercept for trendline rendering
      scatter,             // raw scatter points for chart
      data_points: len,
    };
  });

  // Find the strongest correlation
  const ranked = [...results]
    .filter(r => r.pearson_r !== null)
    .sort((a, b) => Math.abs(b.pearson_r) - Math.abs(a.pearson_r));

  return {
    success: true,
    data_points_used: data.length,
    correlations: results,
    strongest_correlation: ranked[0]?.pair ?? 'N/A',
    summary: ranked.map(r => ({
      pair: r.pair,
      r: r.pearson_r,
      interpretation: r.interpretation,
    })),
  };
}

module.exports = { analyseCorrelations, pearsonR, interpretR };
