const mongoose = require('mongoose');

const roundTo = (val, decimals) => {
  if (val === undefined || val === null) return val;
  return Number(Math.round(val + 'e' + decimals) + 'e-' + decimals);
};

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
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.temperature = roundTo(ret.temperature, 1);
      ret.humidity = roundTo(ret.humidity, 1);
      ret.soil_moisture = roundTo(ret.soil_moisture, 1);
      ret.lux = roundTo(ret.lux, 1);
      ret.aqi = roundTo(ret.aqi, 0);
      ret.tvoc = roundTo(ret.tvoc, 0);
      ret.eco2 = roundTo(ret.eco2, 0);
      ret.dli = roundTo(ret.dli, 2);
      return ret;
    }
  },
  toObject: {
    transform: (doc, ret) => {
      ret.temperature = roundTo(ret.temperature, 1);
      ret.humidity = roundTo(ret.humidity, 1);
      ret.soil_moisture = roundTo(ret.soil_moisture, 1);
      ret.lux = roundTo(ret.lux, 1);
      ret.aqi = roundTo(ret.aqi, 0);
      ret.tvoc = roundTo(ret.tvoc, 0);
      ret.eco2 = roundTo(ret.eco2, 0);
      ret.dli = roundTo(ret.dli, 2);
      return ret;
    }
  }
});

module.exports = mongoose.model('SensorData', sensorDataSchema);
