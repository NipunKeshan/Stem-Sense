const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  device_id: { type: String, required: true },
  temperature: { type: Number, required: true },
  humidity: { type: Number, required: true },
  tvoc: { type: Number, required: true },
  eco2: { type: Number, required: true },
  aqi: { type: Number, required: true },
  lux: { type: Number, required: true },
  dli: { type: Number, required: true },
  soil_moisture: { type: Number, required: true },
  pump_state: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('SensorData', sensorDataSchema);
