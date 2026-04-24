const SensorData = require('../models/SensorData');
const PumpCommand = require('../models/PumpCommand');

const roundTo = (val, decimals) => {
  if (val === undefined || val === null) return val;
  return Number(Math.round(val + 'e' + decimals) + 'e-' + decimals);
};

// @desc    Get all sensor data
// @route   GET /api/sensors
// @access  Public
const getSensorData = async (req, res) => {
  try {
    const data = await SensorData.find().sort({ captured_at: -1 });
    const command = await PumpCommand.findOne({ _id: 'global' });
    res.status(200).json({ 
      success: true, 
      count: data.length, 
      data,
      desired_pump_state: command ? command.pump : 0 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error', message: error.message });
  }
};

// @desc    Get latest sensor data reading
// @route   GET /api/sensors/latest
// @access  Public
const getLatestSensorData = async (req, res) => {
  try {
    const data = await SensorData.findOne().sort({ captured_at: -1 });
    const command = await PumpCommand.findOne({ _id: 'global' });
    res.status(200).json({ 
      success: true, 
      data,
      desired_pump_state: command ? command.pump : 0
    });
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
      pump_state,
      manual_override
    } = req.body;

    // Create sensor record
    const sensorData = await SensorData.create({
      sensor_id: device_id,
      captured_at: new Date(),
      ts_source: 'node_backend',
      env: {
        temperature_c: temperature,
        humidity_pct: humidity,
        tvoc_ppb: tvoc,
        eco2_ppm: eco2,
        aqi: aqi,
        lux: lux
      },
      soil: {
        moisture_pct: soil_moisture
      },
      actuators: {
        pump_on: pump_state === 1
      }
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
    const data = await SensorData.findOne().sort({ captured_at: -1 });
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
    const data = await SensorData.findOne().sort({ captured_at: -1 });
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
    const data = await SensorData.findOne().sort({ captured_at: -1 });
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
    const data = await SensorData.findOne().sort({ captured_at: -1 });
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
    const data = await SensorData.findOne().sort({ captured_at: -1 });
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
    const data = await SensorData.findOne().sort({ captured_at: -1 });
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
    const data = await SensorData.findOne().sort({ captured_at: -1 });
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
    const data = await SensorData.findOne().sort({ captured_at: -1 });
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

// Desired pump state is now persisted to MongoDB pump_command collection

// @desc    Toggle pump on/off (used by frontend)
// @route   POST /api/sensors/pump
// @access  Public
const togglePump = async (req, res) => {
  try {
    const { pump } = req.body;

    if (pump === undefined || (pump !== 0 && pump !== 1)) {
      return res.status(400).json({
        success: false,
        error: 'pump must be 0 or 1'
      });
    }

    // Persist to pump_command collection (global doc)
    await PumpCommand.findOneAndUpdate(
      { _id: 'global' },
      { 
        pump: pump, 
        updated_at: new Date() 
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: `Pump ${pump === 1 ? 'ON' : 'OFF'} command sent`,
      pump_state: pump
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error', message: error.message });
  }
};

// @desc    Get desired pump state
// @route   GET /api/sensors/pump
// @access  Public
const getPumpState = async (req, res) => {
  try {
    const data = await SensorData.findOne().sort({ captured_at: -1 });
    const command = await PumpCommand.findOne({ _id: 'global' });

    res.status(200).json({
      success: true,
      desired_pump_state: command ? command.pump : 0,
      actual_pump_state: data?.pump_state || 0,
      manual_override: data?.manual_override || 0
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error', message: error.message });
  }
};

// @desc    Get sensor statistics (Last 24h)
// @route   GET /api/sensors/stats
// @access  Public
const getSensorStats = async (req, res) => {
  try {
    // Get data from last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let data = await SensorData.find({ captured_at: { $gte: twentyFourHoursAgo } }).sort({ captured_at: -1 });

    // Fallback: If no data in 24h, get latest 100 readings (for dev/low activity)
    if (!data || data.length === 0) {
      data = await SensorData.find().sort({ captured_at: -1 }).limit(100);
    }

    if (!data || data.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          temperature: { min: 0, max: 0, avg: 0 },
          humidity: { min: 0, max: 0, avg: 0 },
          soil_moisture: { min: 0, max: 0, avg: 0 },
          lux: { min: 0, max: 0, avg: 0 },
          aqi: { min: 0, max: 0, avg: 0 },
          tvoc: { min: 0, max: 0, avg: 0 },
          eco2: { min: 0, max: 0, avg: 0 },
        }
      });
    }

    const calculate = (arr, key, decimals = 1) => {
      const values = arr.map(d => d[key]).filter(v => v !== undefined && v !== null);
      if (values.length === 0) return { min: 0, max: 0, avg: 0 };
      
      const sum = values.reduce((a, b) => a + b, 0);
      return {
        min: roundTo(Math.min(...values), decimals),
        max: roundTo(Math.max(...values), decimals),
        avg: roundTo(sum / values.length, decimals)
      };
    };

    const stats = {
      temperature: calculate(data, 'temperature', 1),
      humidity: calculate(data, 'humidity', 1),
      soil_moisture: calculate(data, 'soil_moisture', 1),
      lux: calculate(data, 'lux', 1),
      aqi: calculate(data, 'aqi', 0),
      tvoc: calculate(data, 'tvoc', 0),
      eco2: calculate(data, 'eco2', 0),
      dli: calculate(data, 'dli', 2),
    };

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error', message: error.message });
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
  setPumpState,
  togglePump,
  getPumpState,
  getSensorStats
};
