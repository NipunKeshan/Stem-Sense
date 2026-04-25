const mongoose = require('mongoose');

const roundTo = (val, decimals) => {
  if (val === undefined || val === null) return val;
  return Number(Math.round(val + 'e' + decimals) + 'e-' + decimals);
};

const sensorDataSchema = new mongoose.Schema({
  sensor_id: { type: String, required: true },
  captured_at: { type: Date, required: true },
  ts_source: { type: String },
  env: {
    temperature_c: { type: Number },
    humidity_pct: { type: Number },
    tvoc_ppb: { type: Number },
    eco2_ppm: { type: Number },
    aqi: { type: Number },
    lux: { type: Number }
  },
  soil: {
    moisture_pct: { type: Number }
  },
  actuators: {
    pump_on: { type: Boolean }
  }
}, {
  collection: 'telemetry',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals to flatten the data for the frontend (keeping it compatible with existing code)
sensorDataSchema.virtual('temperature').get(function() { return roundTo(this.env?.temperature_c, 1); });
sensorDataSchema.virtual('humidity').get(function() { return roundTo(this.env?.humidity_pct, 1); });
sensorDataSchema.virtual('tvoc').get(function() { return roundTo(this.env?.tvoc_ppb, 0); });
sensorDataSchema.virtual('eco2').get(function() { return roundTo(this.env?.eco2_ppm, 0); });
sensorDataSchema.virtual('aqi').get(function() { return roundTo(this.env?.aqi, 0); });
sensorDataSchema.virtual('lux').get(function() { return roundTo(this.env?.lux, 1); });
sensorDataSchema.virtual('soil_moisture').get(function() { return roundTo(this.soil?.moisture_pct, 1); });
sensorDataSchema.virtual('pump_state').get(function() { return this.actuators?.pump_on ? 1 : 0; });
sensorDataSchema.virtual('timestamp').get(function() { return this.captured_at; });
sensorDataSchema.virtual('device_id').get(function() { return this.sensor_id; });

sensorDataSchema.index({ captured_at: -1 });

module.exports = mongoose.model('SensorData', sensorDataSchema);
