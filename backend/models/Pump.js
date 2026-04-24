const mongoose = require('mongoose');

const pumpSchema = new mongoose.Schema({
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const Pump = mongoose.model('PumpData', pumpSchema);
module.exports = Pump;
