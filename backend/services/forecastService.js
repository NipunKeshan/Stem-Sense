exports.getTrend = (dataList) => {
  const avg = dataList.reduce((sum, d) => sum + d.soil_moisture, 0) / dataList.length;

  return {
    trend: avg < 50 ? "Decreasing" : "Stable",
    forecast: avg < 40 ? "Irrigation needed soon" : "Healthy"
  };
};