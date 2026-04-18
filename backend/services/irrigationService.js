const { predictIrrigation } = require("./mlService");

exports.getDecision = async (data) => {

  // ✅ RULE 1: Soil already wet
  if (data.soil_moisture > 70) {
    return { irrigation: 0, reason: "Soil already wet" };
  }

  // ✅ RULE 2: High humidity
  if (data.humidity > 85) {
    return { irrigation: 0, reason: "High humidity" };
  }

  // ✅ RULE 3: Night time
  if (data.hour >= 20 || data.hour < 6) {
    return { irrigation: 0, reason: "Night restriction" };
  }

  // ✅ ML decision
  const mlResult = await predictIrrigation(data);
  console.log("ML Decision:", mlResult);

  return {
    irrigation: mlResult.irrigation,
    reason: "ML decision"
  };
};