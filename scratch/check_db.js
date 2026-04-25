const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const SensorData = require('../backend/models/SensorData');

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stemsense');
    const count = await SensorData.countDocuments();
    console.log('Total SensorData count:', count);
    
    if (count > 0) {
      const latest = await SensorData.findOne().sort({ captured_at: -1 });
      console.log('Latest record:', JSON.stringify(latest, null, 2));
      console.log('Latest record (toObject with virtuals):', JSON.stringify(latest.toObject({ virtuals: true }), null, 2));
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
