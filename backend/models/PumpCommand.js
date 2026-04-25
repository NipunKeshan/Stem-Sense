const mongoose = require('mongoose');

const pumpCommandSchema = new mongoose.Schema({
  _id: { type: String, default: 'global' },
  pump: { type: Number, required: true },
  source: { type: String, enum: ['manual', 'ml', 'unknown'], default: 'unknown' },
  updated_at: { type: Date, default: Date.now }
}, {
  collection: 'pump_command',
  timestamps: false // We manage updated_at manually to match server.py
});

module.exports = mongoose.model('PumpCommand', pumpCommandSchema);
