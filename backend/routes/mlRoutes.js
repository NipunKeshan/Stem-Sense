const express = require('express');
const router  = express.Router();
const axios   = require('axios');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// Helper: forward errors cleanly
const mlProxy = (path) => async (req, res) => {
  try {
    const { data } = await axios.get(`${ML_URL}${path}`, { timeout: 15000 });
    res.json(data);
  } catch (err) {
    const status  = err.response?.status  || 500;
    const message = err.response?.data?.error || err.message;
    console.error(`[ML Proxy] ${path} →`, message);
    res.status(status).json({ error: 'ML service error', details: message });
  }
};

// GET /api/ml/health          — check if ML service is alive
router.get('/health',     mlProxy('/health'));

// GET /api/ml/model-info      — model name, metrics, feature list
router.get('/model-info', mlProxy('/model-info'));

// GET /api/ml/stress-forecast — 30-day day-by-day stress predictions
router.get('/stress-forecast', mlProxy('/forecast'));

// GET /api/ml/correlation     — correlation matrix + scatter data
router.get('/correlation', mlProxy('/correlation'));

module.exports = router;
