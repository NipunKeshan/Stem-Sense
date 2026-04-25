const SensorData = require('../models/SensorData');
const PumpCommand = require('../models/PumpCommand');
const SystemAlert = require('../models/Alert');

const roundTo = (val, decimals) => {
  if (val === undefined || val === null) return val;
  return Number(Math.round(val + 'e' + decimals) + 'e-' + decimals);
};

// @desc    Get all sensor data
// @route   GET /api/sensors
// @access  Public
const getSensorData = async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '30m';
    const query = {};
    const now = new Date();

    if (timeRange === '30m') {
      const cutoff = new Date(now.getTime() - 30 * 60 * 1000);
      query.captured_at = { $gte: cutoff };
    } else if (timeRange === '1h') {
      const cutoff = new Date(now.getTime() - 1 * 60 * 60 * 1000);
      query.captured_at = { $gte: cutoff };
    } else if (timeRange === '6h') {
      const cutoff = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      query.captured_at = { $gte: cutoff };
    } else if (timeRange === '1d' || timeRange === '24h') { // 24h fallback
      const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      query.captured_at = { $gte: cutoff };
    } else if (timeRange === '7d') {
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      query.captured_at = { $gte: cutoff };
    }
    // If 'all', we don't set a date filter, but we will limit it below

    const data = await SensorData.find(query)
      .sort({ captured_at: -1 })
      .limit(timeRange === 'all' ? 2000 : 0); // Hard limit 2000 for 'all' to prevent crashing

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
      { upsert: true, returnDocument: 'after' }
    );

    // Create a dynamic alert for manual trigger
    await SystemAlert.create({
      severity: 'info',
      message: `Manual Irrigation ${pump === 1 ? 'Started' : 'Stopped'}`,
      type: 'manual'
    });

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

// GET /api/sensors/pump/today
// Aggregates consecutive pump-ON datapoints into runs. A gap > 3 minutes
// between samples breaks a run (fixed 3-minute interval).
const getTodayPumpOnData = async (req, res) => {
  try {
    const gapMs = 3 * 60 * 1000; // fixed 3 minutes

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const data = await SensorData.find({ captured_at: { $gte: startOfDay } }).sort({ captured_at: 1 });

    if (!data || data.length === 0) {
      return res.status(200).json({ success: true, runs: [], total_runs: 0 });
    }

    // Normalize points to [{ ts: Date, pump_on: boolean }]
    const points = data
      .map(d => ({
        ts: d.captured_at ? new Date(d.captured_at) : null,
        pump_on: d.actuators && typeof d.actuators.pump_on !== 'undefined'
          ? Boolean(d.actuators.pump_on)
          : (typeof d.pump_state !== 'undefined' ? d.pump_state === 1 : false)
      }))
      .filter(p => p.ts !== null)
      .sort((a, b) => a.ts - b.ts);

    const runs = [];
    let current = null;

    for (const p of points) {
      if (p.pump_on) {
        if (!current) {
          current = { start: p.ts, end: p.ts, count: 1 };
        } else {
          const diff = p.ts - current.end;
          if (diff <= gapMs) {
            current.end = p.ts;
            current.count += 1;
          } else {
            current.duration_ms = current.end - current.start;
            runs.push({
              start: current.start,
              end: current.end,
              duration_ms: current.duration_ms,
              duration_min: roundTo(current.duration_ms / 60000, 2),
              sample_count: current.count
            });
            current = { start: p.ts, end: p.ts, count: 1 };
          }
        }
      } else if (current) {
        // close current run on encountering pump_off
        current.duration_ms = current.end - current.start;
        runs.push({
          start: current.start,
          end: current.end,
          duration_ms: current.duration_ms,
          duration_min: roundTo(current.duration_ms / 60000, 2),
          sample_count: current.count
        });
        current = null;
      }
    }

    if (current) {
      current.duration_ms = current.end - current.start;
      runs.push({
        start: current.start,
        end: current.end,
        duration_ms: current.duration_ms,
        duration_min: roundTo(current.duration_ms / 60000, 2),
        sample_count: current.count
      });
    }

    const totalMinutes = roundTo(runs.reduce((s, r) => s + (r.duration_ms || 0), 0) / 60000, 2);

    res.status(200).json({
      success: true,
      runs
    });
  } catch (error) {
    console.error(error);
// @desc    Get all alerts with pagination and filtering
// @route   GET /api/sensors/alerts
// @access  Public
const getAlerts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const filterType = req.query.filter || 'all';
    const dateRange = req.query.dateFilter || 'all';

    const baseQuery = {};

    // Apply date filter to baseQuery (used for both data and global counts)
    const now = new Date();
    if (dateRange === 'today') {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      baseQuery.timestamp = { $gte: startOfDay };
    } else if (dateRange === 'last7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      baseQuery.timestamp = { $gte: sevenDaysAgo };
    } else if (dateRange === 'last30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      baseQuery.timestamp = { $gte: thirtyDaysAgo };
    }

    // Build specific query for fetching paginated data
    const query = { ...baseQuery };
    
    // Apply type/severity filter
    if (filterType !== 'all') {
      if (['critical', 'warning'].includes(filterType)) {
        query.severity = filterType;
      } else if (['manual', 'auto'].includes(filterType)) {
        query.type = filterType;
      }
    }

    const startIndex = (page - 1) * limit;

    // Get counts for the top dashboard cards based on the date range (ignoring type filter)
    const [criticalCount, warningCount, manualCount, autoCount, total] = await Promise.all([
      SystemAlert.countDocuments({ ...baseQuery, severity: 'critical' }),
      SystemAlert.countDocuments({ ...baseQuery, severity: 'warning' }),
      SystemAlert.countDocuments({ ...baseQuery, type: 'manual' }),
      SystemAlert.countDocuments({ ...baseQuery, type: 'auto' }),
      SystemAlert.countDocuments(query)
    ]);

    const alerts = await SystemAlert.find(query)
      .sort({ timestamp: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({ 
      success: true, 
      count: alerts.length, 
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      counts: {
        critical: criticalCount,
        warning: warningCount,
        manual: manualCount,
        auto: autoCount
      },
      data: alerts 
    });
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
  togglePump,
  getPumpState,
  getSensorStats,
  getTodayPumpOnData,
  getAlerts
};
