const express = require('express');
const router = express.Router();
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
  setPumpState
} = require('../controllers/sensorController');

router.route('/')
  .get(getSensorData)
  .post(addSensorData);

router.route('/latest')
  .get(getLatestSensorData);

// Individual sensor endpoints
router.route('/temperature')
  .get(getTemperature);

router.route('/humidity')
  .get(getHumidity);

router.route('/tvoc')
  .get(getTvoc);

router.route('/eco2')
  .get(getEco2);

router.route('/aqi')
  .get(getAqi);

router.route('/lux')
  .get(getLux);

router.route('/dli')
  .get(getDli);

router.route('/soil-moisture')
  .get(getSoilMoisture);

// Pump state endpoint
router.route('/pump-state')
  .post(setPumpState);

module.exports = router;
