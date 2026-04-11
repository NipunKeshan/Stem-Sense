const SensorData = require('../models/SensorData');

// @desc    Get all sensor data
// @route   GET /api/sensors
// @access  Public
const getSensorData = async (req, res) => {
  try {
    const data = await SensorData.find().sort({ timestamp: -1 });
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error', message: error.message });
  }
};

// @desc    Get latest sensor data reading
// @route   GET /api/sensors/latest
// @access  Public
const getLatestSensorData = async (req, res) => {
  try {
    const data = await SensorData.findOne().sort({ timestamp: -1 });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error', message: error.message });
  }
};

// @desc    Add new sensor data
// @route   POST /api/sensors
// @access  Public
const addSensorData = async (req, res) => {
  try {
    const {
      device_id,
      temperature,
      humidity,
      tvoc,
      eco2,
      aqi,
      lux,
      dli,
      soil_moisture,
      pump_state
    } = req.body;

    // Create sensor record
    const sensorData = await SensorData.create({
      device_id,
      temperature,
      humidity,
      tvoc,
      eco2,
      aqi,
      lux,
      dli,
      soil_moisture,
      pump_state
    });

    res.status(201).json({
      success: true,
      data: sensorData
    });
  } catch (error) {
    console.error(error);
    // Determine whether mongoose validation failed
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    } else {
      res.status(500).json({ success: false, error: 'Server Error', message: error.message });
    }
  }
};

// @desc    Get latest temperature
// @route   GET /api/sensors/temperature
// @access  Public
const getTemperature = async (req, res) => {
  try {
    const data = await SensorData.findOne().sort({ timestamp: -1 }).select('temperature timestamp');
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error', message: error.message });
  }
};

// @desc    Get latest humidity
// @route   GET /api/sensors/humidity
// @access  Public
const getHumidity = async (req, res) => {
  try {
    const data = await SensorData.findOne().sort({ timestamp: -1 }).select('humidity timestamp');
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error', message: error.message });
  }
};

// @desc    Get latest TVOC
// @route   GET /api/sensors/tvoc
// @access  Public
const getTvoc = async (req, res) => {
  try {
    const data = await SensorData.findOne().sort({ timestamp: -1 }).select('tvoc timestamp');
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error', message: error.message });
  }
};

// @desc    Get latest eCO2
// @route   GET /api/sensors/eco2
// @access  Public
const getEco2 = async (req, res) => {
  try {
    const data = await SensorData.findOne().sort({ timestamp: -1 }).select('eco2 timestamp');
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error', message: error.message });
  }
};

// @desc    Get latest AQI
// @route   GET /api/sensors/aqi
// @access  Public
const getAqi = async (req, res) => {
  try {
    const data = await SensorData.findOne().sort({ timestamp: -1 }).select('aqi timestamp');
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error', message: error.message });
  }
};

// @desc    Get latest Lux (Light intensity)
// @route   GET /api/sensors/lux
// @access  Public
const getLux = async (req, res) => {
  try {
    const data = await SensorData.findOne().sort({ timestamp: -1 }).select('lux timestamp');
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error', message: error.message });
  }
};

// @desc    Get latest DLI (Daily Light Integral)
// @route   GET /api/sensors/dli
// @access  Public
const getDli = async (req, res) => {
  try {
    const data = await SensorData.findOne().sort({ timestamp: -1 }).select('dli timestamp');
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error', message: error.message });
  }
};

// @desc    Get latest soil moisture
// @route   GET /api/sensors/soil-moisture
// @access  Public
const getSoilMoisture = async (req, res) => {
  try {
    const data = await SensorData.findOne().sort({ timestamp: -1 }).select('soil_moisture timestamp');
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error', message: error.message });
  }
};

// @desc    Set pump state
// @route   POST /api/sensors/pump-state
// @access  Public
const setPumpState = async (req, res) => {
  try {
    const { pump_state, device_id } = req.body;

    if (pump_state === undefined) {
      return res.status(400).json({
        success: false,
        error: 'pump_state is required'
      });
    }

    // Create/update pump state record
    const sensorData = await SensorData.create({
      device_id,
      pump_state,
      temperature: 0,
      humidity: 0,
      tvoc: 0,
      eco2: 0,
      aqi: 0,
      lux: 0,
      dli: 0,
      soil_moisture: 0
    });

    res.status(201).json({
      success: true,
      message: 'Pump state updated successfully',
      data: sensorData
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    } else {
      res.status(500).json({ success: false, error: 'Server Error', message: error.message });
    }
  }
};

module.exports = {
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
};
