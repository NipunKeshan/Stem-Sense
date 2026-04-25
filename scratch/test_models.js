const mongoose = require('mongoose');
try {
    const Alert = require('./backend/models/Alert');
    console.log('Alert model loaded successfully');
    const SensorData = require('./backend/models/SensorData');
    console.log('SensorData model loaded successfully');
    const PumpCommand = require('./backend/models/PumpCommand');
    console.log('PumpCommand model loaded successfully');
} catch (err) {
    console.error('Error loading models:', err);
}
process.exit(0);
