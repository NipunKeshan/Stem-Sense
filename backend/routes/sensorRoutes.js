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
  getTodayPumpOnData,
  getSensorStats,
  getAlerts,
  getSensorCorrelation
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

// Correlation endpoint (works from historical DB data, no ML service needed)
router.route('/correlation')
  .get(protect, getSensorCorrelation);

// Pump control endpoint (frontend)
router.route('/pump/today')
  .get(getTodayPumpOnData);

router.route('/pump')
  .get(protect, getPumpState)
  .post(protect, togglePump);

module.exports = router;

