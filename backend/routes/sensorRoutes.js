const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  getSensorData, 
  addSensorData, 
  getLatestSensorData,
  getTemperature,
  getHumidity,
  getTvoc,
  getEco2,
  getAqi,
  getLux,
  getDli,
  getSoilMoisture,
  togglePump,
  getPumpState,
  getSensorStats,
  getAlerts,
  getMLStatus,
  getPaginatedSensorData
} = require('../controllers/sensorController');

router.route('/')
  .get(protect, getSensorData)
  .post(addSensorData); // ESP8266 device posts here — no auth

router.route('/latest')
  .get(protect, getLatestSensorData);

router.route('/stats')
  .get(protect, getSensorStats);

// Individual sensor endpoints
router.route('/temperature')
  .get(protect, getTemperature);

router.route('/humidity')
  .get(protect, getHumidity);

router.route('/tvoc')
  .get(protect, getTvoc);

router.route('/eco2')
  .get(protect, getEco2);

router.route('/aqi')
  .get(protect, getAqi);

router.route('/lux')
  .get(protect, getLux);

router.route('/dli')
  .get(protect, getDli);

router.route('/soil-moisture')
  .get(protect, getSoilMoisture);

// Alerts endpoint
router.route('/alerts')
  .get(protect, getAlerts);

// Pump control endpoint (frontend)
router.route('/pump')
  .get(protect, getPumpState)
  .post(protect, togglePump);

// ML model status endpoint
router.route('/ml-status')
  .get(protect, getMLStatus);

// Paginated sensor data endpoint
router.route('/paginated')
  .get(protect, getPaginatedSensorData);

module.exports = router;

