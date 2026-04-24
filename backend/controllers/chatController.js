const { GoogleGenerativeAI } = require('@google/generative-ai');
const SensorData = require('../models/SensorData');
const SystemAlert = require('../models/Alert');

/**
 * Chatbot Controller — LLM-powered conversational agent for StemSense.
 * 
 * Capabilities:
 *   - Answers natural language queries about sensor data
 *   - Guides users in exploring the dashboard
 *   - Explains trends, comparisons, and anomalies
 *   - Supports decision-oriented questions
 */

const SYSTEM_PROMPT = `You are StemSense AI, an intelligent greenhouse monitoring assistant. You help greenhouse managers understand their sensor data and make informed decisions about plant care.

You have access to real-time sensor data from a greenhouse monitoring system that tracks:
- Soil Moisture (0-100%, optimal range: 40-70%)
- Temperature (°C, optimal range: 20-28°C for most plants)
- Humidity (%, optimal range: 40-60%)
- Air Quality Index (AQI, 1=Excellent, 5=Hazardous)
- TVOC - Total Volatile Organic Compounds (ppb)
- eCO₂ - Equivalent CO₂ (ppm, normal: 400-600)
- Light Intensity (lux, varies by plant type)
- DLI - Daily Light Integral (mol/m²/day, target: 12-20)
- Pump State (irrigation on/off)

Guidelines:
- If the user just says hello or greets you, greet them back naturally and briefly. DO NOT provide a full data analysis unless they specifically ask for an update, status, or analysis.
- If there is an urgent/critical condition (like extremely high temp or saturated soil), you may add a short, single-sentence warning at the end of a greeting, but avoid dumping all sensor data.
- When analyzing data (when requested), mention specific values and thresholds and use bullet points.
- Provide actionable recommendations when appropriate.
- If the user asks about factors that influence a metric, explain the relationships.
- Reference the dashboard pages (Overview, Soil Moisture, Temperature, Air Quality, Light Monitor) when guiding users.
- Use emoji sparingly for visual clarity (🌱, 💧, 🌡️, 💨, ☀️).`;

// Chat with LLM using sensor data context
const chatWithBot = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    // Fetch current sensor context
    const [latestData, recentData, recentAlerts] = await Promise.all([
      SensorData.findOne().sort({ captured_at: -1 }),
      SensorData.find().sort({ captured_at: -1 }).limit(24),
      SystemAlert.find().sort({ timestamp: -1 }).limit(10),
    ]);

    // Build context summary for the LLM
    let sensorContext = 'No sensor data available.';
    if (latestData) {
      sensorContext = `CURRENT SENSOR READINGS (latest):
- Soil Moisture: ${latestData.soil_moisture ?? 'N/A'}%
- Temperature: ${latestData.temperature ?? 'N/A'}°C
- Humidity: ${latestData.humidity ?? 'N/A'}%
- AQI: ${latestData.aqi ?? 'N/A'}
- TVOC: ${latestData.tvoc ?? 'N/A'} ppb
- eCO₂: ${latestData.eco2 ?? 'N/A'} ppm
- Light: ${latestData.lux ?? 'N/A'} lux
- Pump: ${latestData.pump_state === 1 ? 'ON' : 'OFF'}
- Last Reading: ${latestData.timestamp ? new Date(latestData.timestamp).toLocaleString() : 'Unknown'}`;
    }

    // Compute trends from recent 24 readings
    let trendContext = '';
    if (recentData && recentData.length > 1) {
      const temps = recentData.map(d => d.temperature).filter(Boolean);
      const moistures = recentData.map(d => d.soil_moisture).filter(Boolean);
      const aqis = recentData.map(d => d.aqi).filter(Boolean);

      if (temps.length > 1) {
        const avgTemp = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
        const maxTemp = Math.max(...temps).toFixed(1);
        const minTemp = Math.min(...temps).toFixed(1);
        trendContext += `\nTEMPERATURE TREND (last ${temps.length} readings): avg=${avgTemp}°C, min=${minTemp}°C, max=${maxTemp}°C`;
      }
      if (moistures.length > 1) {
        const avgMoist = (moistures.reduce((a, b) => a + b, 0) / moistures.length).toFixed(1);
        const maxMoist = Math.max(...moistures).toFixed(1);
        const minMoist = Math.min(...moistures).toFixed(1);
        trendContext += `\nMOISTURE TREND (last ${moistures.length} readings): avg=${avgMoist}%, min=${minMoist}%, max=${maxMoist}%`;
      }
      if (aqis.length > 1) {
        const avgAqi = (aqis.reduce((a, b) => a + b, 0) / aqis.length).toFixed(1);
        trendContext += `\nAQI TREND (last ${aqis.length} readings): avg=${avgAqi}`;
      }
    }

    // Recent alerts context
    let alertContext = '';
    if (recentAlerts && recentAlerts.length > 0) {
      alertContext = '\nRECENT ALERTS:\n' + recentAlerts.slice(0, 5).map(a => 
        `- [${a.severity?.toUpperCase() || 'INFO'}] ${a.message} (${new Date(a.timestamp).toLocaleTimeString()})`
      ).join('\n');
    }

    const fullContext = `${sensorContext}${trendContext}${alertContext}`;

    // Check for Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback: Rule-based responses when no API key is configured
      return res.status(200).json({
        success: true,
        response: generateFallbackResponse(message, latestData, recentData),
        source: 'rule-based',
      });
    }

    const strictInstruction = `\n\nCRITICAL BEHAVIOR RULES FOR GREETINGS:
If the user's message is just a greeting (like "hi", "hello", "hey"):
1. You MUST keep your response under 2 sentences.
2. You MUST NOT output any data analysis, readings, or recommendations.
3. You MAY include ONE brief sentence if there is a critical alert (e.g., "Hello! Just a heads up, the temperature is currently very high. How can I help?").
IGNORE all sensor data below unless the user asks a specific question.`;

    const finalSystemPrompt = SYSTEM_PROMPT + strictInstruction + '\n\n' + fullContext;

    // Call Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-flash-latest',
      systemInstruction: finalSystemPrompt
    });

    // Build chat history - Gemini requires history to start with a 'user' message
    const rawHistory = (history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Find the first user message to comply with Gemini API requirements
    const firstUserIndex = rawHistory.findIndex(m => m.role === 'user');
    const chatHistory = firstUserIndex !== -1 ? rawHistory.slice(firstUserIndex) : [];

    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    res.status(200).json({
      success: true,
      response,
      source: 'gemini',
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
      message: error.message,
    });
  }
};

/**
 * Rule-based fallback when no LLM API key is configured.
 * Demonstrates meaningful interaction with the visual analytics system.
 */
function generateFallbackResponse(message, latestData, recentData) {
  const msg = message.toLowerCase();

  // Current readings
  if (msg.includes('current') || msg.includes('now') || msg.includes('latest') || msg.includes('reading')) {
    if (!latestData) return "I don't have any sensor data yet. Please ensure the greenhouse sensors are connected.";
    return `📊 **Current Greenhouse Status**\n\n` +
      `- 💧 Soil Moisture: **${latestData.soil_moisture ?? 'N/A'}%**\n` +
      `- 🌡️ Temperature: **${latestData.temperature ?? 'N/A'}°C**\n` +
      `- 💨 Humidity: **${latestData.humidity ?? 'N/A'}%**\n` +
      `- 🌬️ Air Quality: **${latestData.aqi ?? 'N/A'}** (${latestData.aqi <= 2 ? 'Good' : 'Needs Attention'})\n` +
      `- ☀️ Light: **${latestData.lux ?? 'N/A'} lux**\n` +
      `- 🚿 Pump: **${latestData.pump_state === 1 ? 'Running' : 'Off'}**\n\n` +
      `Check the **Overview** page for live trends, or visit specific sensor pages for detailed analysis.`;
  }

  // Moisture / watering
  if (msg.includes('moisture') || msg.includes('water') || msg.includes('dry') || msg.includes('irrigat')) {
    const moisture = latestData?.soil_moisture;
    if (!moisture) return "No soil moisture data available. Check if the soil sensor is connected.";
    let advice = '';
    if (moisture < 30) advice = '⚠️ Soil is **dry**! Consider starting irrigation immediately. Visit the **Soil Moisture** page to activate the pump.';
    else if (moisture < 40) advice = 'Soil moisture is getting low. You may want to schedule watering soon.';
    else if (moisture <= 70) advice = '✅ Soil moisture is in the **optimal range** (40-70%). No action needed.';
    else if (moisture < 95) advice = 'Soil is quite wet. Hold off on watering to prevent waterlogging.';
    else advice = '🚨 Soil is **saturated** (≥95%)! Safety override is blocking the pump.';
    return `💧 **Soil Moisture: ${moisture}%**\n\n${advice}`;
  }

  // Temperature
  if (msg.includes('temperature') || msg.includes('temp') || msg.includes('hot') || msg.includes('cold')) {
    const temp = latestData?.temperature;
    const humidity = latestData?.humidity;
    if (!temp) return "No temperature data available.";
    let advice = '';
    if (temp > 30) advice = '⚠️ Temperature is **high**. Consider ventilation or shade cloth.';
    else if (temp < 15) advice = '⚠️ Temperature is **low**. Check heating systems.';
    else advice = '✅ Temperature is within optimal range (20-28°C).';
    return `🌡️ **Temperature: ${temp}°C** | Humidity: ${humidity ?? 'N/A'}%\n\n${advice}\n\nVisit the **Temperature & Humidity** page for historical trends and comfort analysis.`;
  }

  // Air quality
  if (msg.includes('air') || msg.includes('quality') || msg.includes('voc') || msg.includes('co2')) {
    const aqi = latestData?.aqi;
    const tvoc = latestData?.tvoc;
    const eco2 = latestData?.eco2;
    return `🌬️ **Air Quality Report**\n\n` +
      `- AQI: **${aqi ?? 'N/A'}** (${aqi <= 1 ? 'Excellent' : aqi <= 2 ? 'Good' : 'Needs Attention'})\n` +
      `- TVOC: **${tvoc ?? 'N/A'} ppb** (${tvoc <= 100 ? 'Clean' : 'Elevated'})\n` +
      `- eCO₂: **${eco2 ?? 'N/A'} ppm** (${eco2 <= 600 ? 'Normal' : 'High'})\n\n` +
      `Visit the **Air Quality** page for trend analysis with the dual-axis chart.`;
  }

  // Light
  if (msg.includes('light') || msg.includes('lux') || msg.includes('sun') || msg.includes('dark')) {
    const lux = latestData?.lux;
    return `☀️ **Light Intensity: ${lux ?? 'N/A'} lux**\n\n` +
      `${lux < 100 ? 'Low light conditions. Supplemental lighting may be needed.' : 
        lux < 500 ? 'Moderate light — adequate for shade plants.' :
        lux < 2000 ? 'Good light level for most plants.' : 'Very bright — watch for heat stress.'}\n\n` +
      `Check the **Light Monitor** page for DLI (Daily Light Integral) tracking.`;
  }

  // Trends / analysis
  if (msg.includes('trend') || msg.includes('pattern') || msg.includes('analysis') || msg.includes('factor')) {
    if (!recentData || recentData.length < 2) return "Not enough data for trend analysis. Please wait for more readings.";
    const temps = recentData.map(d => d.temperature).filter(Boolean);
    const moistures = recentData.map(d => d.soil_moisture).filter(Boolean);
    const tempTrend = temps.length > 1 ? (temps[0] > temps[temps.length - 1] ? '📈 rising' : '📉 falling') : 'stable';
    const moistTrend = moistures.length > 1 ? (moistures[0] > moistures[moistures.length - 1] ? '📈 rising' : '📉 falling') : 'stable';
    return `📊 **Trend Analysis (Last ${recentData.length} Readings)**\n\n` +
      `- Temperature trend: ${tempTrend}\n` +
      `- Moisture trend: ${moistTrend}\n\n` +
      `Use the **brushing tool** on the Overview chart to zoom into specific time ranges. Toggle series on/off to compare metrics side by side.`;
  }

  // Help / capabilities
  if (msg.includes('help') || msg.includes('what can') || msg.includes('how to') || msg.includes('guide')) {
    return `🌱 **StemSense AI — How I Can Help**\n\n` +
      `I can assist you with:\n\n` +
      `- 📊 **"What are the current readings?"** — Get all sensor values\n` +
      `- 💧 **"Should I water the plants?"** — Moisture-based irrigation advice\n` +
      `- 🌡️ **"Is the temperature okay?"** — Environmental assessment\n` +
      `- 🌬️ **"How is the air quality?"** — AQI, TVOC & CO₂ analysis\n` +
      `- ☀️ **"Is there enough light?"** — Light & DLI check\n` +
      `- 📈 **"Show me trends"** — Analyze recent data patterns\n` +
      `- 🤔 **"What factors influence soil moisture?"** — Cause analysis\n\n` +
      `You can also explore the dashboard:\n` +
      `- Use **time range filters** on chart pages to zoom into periods\n` +
      `- Toggle **series buttons** to compare metrics\n` +
      `- Use the **brush tool** on the Overview chart to select ranges`;
  }

  // Default
  return `I'm StemSense AI, your greenhouse assistant 🌱\n\nI can help you understand your sensor data, check environmental conditions, and make decisions about irrigation and plant care.\n\nTry asking:\n- "What are the current readings?"\n- "Should I water the plants?"\n- "Show me temperature trends"\n- "How is the air quality?"`;
}

module.exports = { chatWithBot };
