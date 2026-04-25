const mongoose = require('mongoose');

const pumpCommandSchema = new mongoose.Schema({
  _id: { type: String, default: 'global' },
  pump: { type: Number, required: true },
  updated_at: { type: Date, default: Date.now }
}, {
  collection: 'pump_command',
  timestamps: false // We manage updated_at manually to match server.py
});

module.exports = mongoose.model('PumpCommand', pumpCommandSchema);
