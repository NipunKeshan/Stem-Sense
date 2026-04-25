const http = require('http');

function sendReading(scenarioName, data) {
  const payload = JSON.stringify(data);
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/sensors',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  console.log(`\n🌿 --- Scenario: ${scenarioName} ---`);
  console.log(`Payload sent:`);
  console.log(JSON.stringify(data, null, 2));

  const req = http.request(options, (res) => {
    let responseBody = '';
    res.on('data', (chunk) => responseBody += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(responseBody);
        if (json.manual_override) {
           console.log(`\n🛑 [Result] ML Engine is in STANDBY (Manual override active in the last 10 minutes).`);
           console.log(`To see ML in action immediately, you can restart the server or wait 10 minutes.`);
        } else {
           console.log(`\n🤖 [Result] ML Decision: Pump ${json.ml_decision === 1 ? 'ON 🟢' : 'OFF 🔴'}`);
           console.log(`   Confidence: ${(json.ml_confidence * 100).toFixed(1)}%`);
           console.log(`\n✅ Dashboard should now update to reflect this decision!`);
        }
      } catch(e) {
        console.log(`[Response] Status: ${res.statusCode} | Body: ${responseBody}`);
      }
    });
  });

  req.on('error', (error) => {
    console.error(`\n❌ [Error] Could not reach backend server: ${error.message}`);
    console.error(`Ensure your backend server is running on port 5000 (npm run dev)`);
  });

  req.write(payload);
  req.end();
}

const arg = process.argv[2];

const scenarios = {
  hot_dry: {
    device_id: 'demo_node_01',
    temperature: 34,
    humidity: 40,
    tvoc: 180,
    eco2: 430,
    aqi: 3,
    lux: 1200,
    soil_moisture: 30, // Dry soil
    pump_state: 0
  },
  cool_wet: {
    device_id: 'demo_node_01',
    temperature: 18,
    humidity: 78,
    tvoc: 110,
    eco2: 405,
    aqi: 25,
    lux: 200,
    soil_moisture: 72, // Wet soil
    pump_state: 0
  }
};

if (arg === 'hot') {
  sendReading('Hot & Dry (Should trigger Pump ON)', scenarios.hot_dry);
} else if (arg === 'cool') {
  sendReading('Cool & Wet (Should trigger Pump OFF)', scenarios.cool_wet);
} else {
  console.log("\n🧪 StemSense ML Demo Script");
  console.log("============================");
  console.log("Usage: node demo_ml.js [hot|cool]");
  console.log("\nCommands:");
  console.log("  node demo_ml.js hot   -> Sends Hot/Dry data (Triggers Pump ON)");
  console.log("  node demo_ml.js cool  -> Sends Cool/Wet data (Triggers Pump OFF)\n");
}
