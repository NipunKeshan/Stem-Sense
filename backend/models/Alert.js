const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  severity: { 
    type: String, 
    enum: ['critical', 'warning', 'info', 'normal'], 
    default: 'info' 
  },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['manual', 'auto', 'system'], 
    default: 'system' 
  },
  timestamp: { type: Date, default: Date.now }
}, {
  collection: 'alerts',
  timestamps: true
});

module.exports = mongoose.model('SystemAlert', alertSchema);
