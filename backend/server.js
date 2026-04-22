require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const User = require('./models/User');
const SensorData = require('./models/SensorData');
const analyticsRoutes = require('./routes/analyticsRoutes');
// Connect to database
connectDB();

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        permissions: ['Overview', 'Soil Moisture', 'Temperature', 'Air Quality', 'Light Monitor', 'System Health', 'Alerts', 'Settings', 'Admin Panel']
      });
      console.log('Admin user seeded');
    }
  } catch (error) {
    console.error('Error seeding admin', error);
  }
};

// Seed test sensor data
const seedSensorData = async () => {
  try {
    const existingData = await SensorData.countDocuments();
    if (existingData === 0) {
      const testData = [];
      const now = new Date();
      
      // Generate 24 hours of test data (hourly readings)
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
        testData.push({
          device_id: 'DEVICE_001',
          temperature: 22 + Math.random() * 6,
          humidity: 45 + Math.random() * 30,
          tvoc: 100 + Math.random() * 200,
          eco2: 400 + Math.random() * 300,
          aqi: 30 + Math.random() * 50,
          lux: 200 + Math.random() * 800,
          dli: 2.5 + Math.random() * 2,
          soil_moisture: 40 + Math.random() * 40,
          pump_state: Math.random() > 0.5 ? 1 : 0,
          timestamp
        });
      }
      
      await SensorData.insertMany(testData);
      console.log('Test sensor data seeded (24 hours of readings)');
    }
  } catch (error) {
    console.error('Error seeding sensor data', error);
  }
};

seedAdmin();
seedSensorData();

const app = express();

// Middleware
app.use(cors());
// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const sensorRoutes = require('./routes/sensorRoutes');
app.use('/api/sensors', sensorRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('IoT Sensor Backend API is running... Please use /api/sensors for endpoints.');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


