const express = require('express');
const router = express.Router();
const { getStressForecast, getCorrelationAnalysis } = require('../controllers/analyticsController');

// GET /api/analytics/stress-forecast?days=14
router.route('/stress-forecast').get(getStressForecast);

// GET /api/analytics/correlation
router.route('/correlation').get(getCorrelationAnalysis);

module.exports = router;
