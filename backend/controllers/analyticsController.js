const SensorData = require('../models/SensorData');
const { forecastStress } = require('../services/stressForecastService');
const { analyseCorrelations } = require('../services/correlationService');

/**
 * @desc   Forecast plant stress score for next N days (7 or 14)
 * @route  GET /api/analytics/stress-forecast?days=14
 * @access Public
 *
 * Query params:
 *   days  - number of forecast days: 7 or 14 (default 14)
 */
const getStressForecast = async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days) || 14, 7), 14);

    // Fetch latest 20 readings (sorted newest first)
    const readings = await SensorData.find()
      .sort({ timestamp: -1 })
      .limit(20)
      .select('temperature humidity soil_moisture lux tvoc eco2 aqi timestamp');

    if (!readings || readings.length === 0) {
      return res.status(404).json({ success: false, error: 'No sensor data found.' });
    }

    const result = forecastStress(readings, days);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('[Analytics] Stress forecast error:', error.message);
    res.status(500).json({ success: false, error: 'Server Error', message: error.message });
  }
};

/**
 * @desc   Correlation analysis between sensor pairs
 * @route  GET /api/analytics/correlation
 * @access Public
 */
const getCorrelationAnalysis = async (req, res) => {
  try {
    // Fetch latest 20 readings
    const readings = await SensorData.find()
      .sort({ timestamp: -1 })
      .limit(20)
      .select('temperature humidity soil_moisture lux tvoc eco2 aqi timestamp');

    if (!readings || readings.length < 3) {
      return res.status(404).json({
        success: false,
        error: 'Not enough sensor data. Need at least 3 readings.',
      });
    }

    const result = analyseCorrelations(readings);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('[Analytics] Correlation error:', error.message);
    res.status(500).json({ success: false, error: 'Server Error', message: error.message });
  }
};

module.exports = { getStressForecast, getCorrelationAnalysis };
