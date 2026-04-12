import React, { useState, useEffect } from 'react';
import { ThermometerSun, Droplets, Wind, Lightbulb, Waves, Zap, Leaf, Loader, Bell, Download, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Wifi, WifiOff, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';

import StatCard from '../components/StatCard';

// Comfort Level Indicator

// Comfort Level Indicator
const ComfortLevelCard = ({ temperature, humidity }: any) => {
  const getComfortLevel = () => {
    // Comfort zone: 20-24°C and 30-50% humidity
    const tempScore = Math.abs(temperature - 22) <= 2 ? 100 : Math.max(0, 100 - Math.abs(temperature - 22) * 15);
    const humidScore = humidity >= 30 && humidity <= 50 ? 100 : Math.max(0, 100 - Math.abs(humidity - 40) * 1.5);
    const overallScore = (tempScore + humidScore) / 2;
    
    if (overallScore >= 80) return { level: 'Excellent', color: 'bg-green-50 text-green-700', score: Math.round(overallScore) };
    if (overallScore >= 60) return { level: 'Good', color: 'bg-blue-50 text-blue-700', score: Math.round(overallScore) };
    if (overallScore >= 40) return { level: 'Fair', color: 'bg-yellow-50 text-yellow-700', score: Math.round(overallScore) };
    return { level: 'Poor', color: 'bg-red-50 text-red-700', score: Math.round(overallScore) };
  };

  const comfort = getComfortLevel();

  return (
    <div className={`rounded-lg shadow-md p-4 md:p-6 ${comfort.color.split(' ')[0]}`}>
      <h3 className="text-sm font-medium text-gray-600 mb-3">Comfort Level</h3>
      <div className="text-center">
        <p className={`text-3xl md:text-4xl font-bold ${comfort.color.split(' ')[1]}`}>{comfort.score}%</p>
        <p className={`text-sm font-semibold mt-2 ${comfort.color.split(' ')[1]}`}>{comfort.level}</p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
          <div
            className={`h-2 rounded-full transition-all ${comfort.color.split(' ')[0].replace('50', '500')}`}
            style={{ width: `${comfort.score}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default function Temperature() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [latestData, setLatestData] = useState<any>(null);
  const [previousData, setPreviousData] = useState<any>(null);
  const [stats, setStats] = useState<any>({
    maxTemp: 0,
    minTemp: 0,
    avgHumidity: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Alert Management
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');
  
  // Threshold Settings
  const [thresholds, setThresholds] = useState({
    maxTemp: 30,
    minTemp: 15,
    maxHumidity: 75,
    minHumidity: 30,
  });
  const [showThresholdForm, setShowThresholdForm] = useState(false);
  
  // Quick Actions
  const [actions, setActions] = useState({
    lightsOn: false,
    fanOn: false,
    windowOpen: false,
  });
  
  // Load from cache on mount
  useEffect(() => {
    const cachedAlerts = localStorage.getItem('sensorAlerts');
    const cachedThresholds = localStorage.getItem('sensorThresholds');
    
    if (cachedAlerts) setAlerts(JSON.parse(cachedAlerts));
    if (cachedThresholds) setThresholds(JSON.parse(cachedThresholds));
  }, []);

  // Save alerts to cache
  useEffect(() => {
    localStorage.setItem('sensorAlerts', JSON.stringify(alerts));
  }, [alerts]);

  // Save thresholds to cache
  useEffect(() => {
    localStorage.setItem('sensorThresholds', JSON.stringify(thresholds));
  }, [thresholds]);

  // Check thresholds and create auto-alerts
  useEffect(() => {
    if (!latestData) return;

    const newAlerts: any[] = [];

    if (latestData.temperature > thresholds.maxTemp) {
      newAlerts.push({
        id: Date.now(),
        message: `Temperature too high: ${latestData.temperature}°C (threshold: ${thresholds.maxTemp}°C)`,
        severity: 'danger',
        type: 'auto',
        timestamp: new Date().toLocaleTimeString(),
      });
    }

    if (latestData.temperature < thresholds.minTemp) {
      newAlerts.push({
        id: Date.now() + 1,
        message: `Temperature too low: ${latestData.temperature}°C (threshold: ${thresholds.minTemp}°C)`,
        severity: 'warning',
        type: 'auto',
        timestamp: new Date().toLocaleTimeString(),
      });
    }

    if (latestData.humidity > thresholds.maxHumidity) {
      newAlerts.push({
        id: Date.now() + 2,
        message: `Humidity too high: ${latestData.humidity}% (threshold: ${thresholds.maxHumidity}%)`,
        severity: 'warning',
        type: 'auto',
        timestamp: new Date().toLocaleTimeString(),
      });
    }

    if (latestData.humidity < thresholds.minHumidity) {
      newAlerts.push({
        id: Date.now() + 3,
        message: `Humidity too low: ${latestData.humidity}% (threshold: ${thresholds.minHumidity}%)`,
        severity: 'info',
        type: 'auto',
        timestamp: new Date().toLocaleTimeString(),
      });
    }

    if (newAlerts.length > 0) {
      setAlerts((prev) => [...newAlerts, ...prev.filter((a) => a.type !== 'auto')].slice(0, 10));
    }
  }, [latestData, thresholds]);

  const addManualAlert = () => {
    if (!alertMessage.trim()) return;

    const newAlert = {
      id: Date.now(),
      message: alertMessage,
      severity: alertSeverity,
      type: 'manual',
      timestamp: new Date().toLocaleTimeString(),
    };

    setAlerts((prev) => [newAlert, ...prev].slice(0, 10));
    setAlertMessage('');
    setShowAlertForm(false);
  };

  const removeAlert = (id: number) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const downloadReport = () => {
    if (!chartData.length) {
      alert('No data available to download');
      return;
    }

    const headers = ['Time', 'Temperature (°C)', 'Humidity (%)'];
    const rows = chartData.map((d) => [d.time, d.temp, d.humidity]);

    let csvContent = 'data:text/csv;charset=utf-8,' + headers.join(',') + '\n';
    rows.forEach((row) => {
      csvContent += row.join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sensor-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch readings
        const resData = await axios.get('http://localhost:5000/api/sensors');
        if (resData.data.success && resData.data.data && resData.data.data.length > 0) {
          const allData = resData.data.data;
          setPreviousData(latestData);
          setLatestData(allData[0]);
          
          const processedData = [...allData]
            .reverse()
            .slice(-24)
            .map((item: any) => {
              const d = new Date(item.timestamp);
              return {
                time: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
                temp: item.temperature || 0,
                humidity: item.humidity || 0,
              };
            });
          setChartData(processedData);
        }

        // Fetch aggregates (Holistic Fix)
        const resStats = await axios.get('http://localhost:5000/api/sensors/stats');
        if (resStats.data.success) {
          const s = resStats.data.data;
          setStats({
            maxTemp: s.temperature.max,
            minTemp: s.temperature.min,
            avgHumidity: s.humidity.avg,
          });
        }
      } catch (err: any) {
        console.error('Error fetching temperature data:', err);
        setError(`Connection Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const getAQIStatus = (aqi: number) => {
    if (aqi <= 50) return 'text-green-700 bg-green-50';
    if (aqi <= 100) return 'text-yellow-700 bg-yellow-50';
    return 'text-red-700 bg-red-50';
  };

  const getSensorStatus = () => {
    if (!latestData) return { status: 'Disconnected', color: 'text-red-600', icon: WifiOff };
    
    try {
      const lastUpdate = new Date(latestData.timestamp);
      const now = new Date();
      const diffSeconds = (now.getTime() - lastUpdate.getTime()) / 1000;
      
      console.log('Sensor Status Debug:', {
        latestData: latestData,
        timestamp: latestData.timestamp,
        lastUpdate: lastUpdate.toISOString(),
        now: now.toISOString(),
        diffSeconds: diffSeconds
      });
      
      // If timestamp is invalid or difference is negative/too large, consider it connected
      if (isNaN(diffSeconds) || diffSeconds < 0) {
        return { status: 'Connected', color: 'text-green-600', icon: Wifi };
      }
      
      // Adjusted thresholds:
      // Connected: data less than 2 minutes old
      // Connected (Delayed): data 2-10 minutes old
      // Disconnected: data older than 10 minutes
      if (diffSeconds < 120) return { status: 'Connected', color: 'text-green-600', icon: Wifi };
      if (diffSeconds < 600) return { status: 'Connected (Delayed)', color: 'text-yellow-600', icon: Wifi };
      return { status: 'Disconnected', color: 'text-red-600', icon: WifiOff };
    } catch (error) {
      console.error('Error parsing sensor status:', error);
      return { status: 'Connected', color: 'text-green-600', icon: Wifi };
    }
  };

  if (loading && !latestData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading temperature data...</p>
        </div>
      </div>
    );
  }

  if (error && !latestData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p className="font-semibold">{error}</p>
          <p className="text-sm mt-2">Please make sure the backend is running at http://localhost:5000</p>
        </div>
      </div>
    );
  }

  const sensorStatus = getSensorStatus();
  const StatusIcon = sensorStatus.icon;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header with Sensor Status and Actions */}
      {latestData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Device Info */}
          <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Device ID:</span> {latestData.device_id}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Last updated: {new Date(latestData.timestamp).toLocaleString()}
                </p>
              </div>
              {loading && <Loader className="w-4 h-4 animate-spin text-blue-600" />}
            </div>
          </div>

          {/* Sensor Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-center">
            <div className="text-center">
              <StatusIcon className={`w-6 h-6 mx-auto mb-2 ${sensorStatus.color}`} />
              <p className={`text-sm font-semibold ${sensorStatus.color}`}>{sensorStatus.status}</p>
              <p className="text-xs text-gray-500 mt-1">Sensor Status</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Environmental Metrics */}
      {latestData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <StatCard
            icon={ThermometerSun}
            title="Temperature"
            value={latestData.temperature}
            unit="°C"
            trend={previousData ? {
              value: Math.abs(latestData.temperature - previousData.temperature).toFixed(1),
              isUp: latestData.temperature > previousData.temperature
            } : undefined}
            status={{
              label: latestData.temperature > thresholds.maxTemp ? 'High' : 'Normal',
              type: latestData.temperature > thresholds.maxTemp ? 'danger' : 'success'
            }}
            color="bg-orange-500"
          />

          <StatCard
            icon={Droplets}
            title="Humidity"
            value={latestData.humidity}
            unit="%"
            trend={previousData ? {
              value: Math.abs(latestData.humidity - previousData.humidity).toFixed(1),
              isUp: latestData.humidity > previousData.humidity
            } : undefined}
            status={{
              label: latestData.humidity > thresholds.maxHumidity ? 'High' : 'Normal',
              type: latestData.humidity > thresholds.maxHumidity ? 'warning' : 'success'
            }}
            color="bg-blue-500"
          />

          <ComfortLevelCard temperature={latestData.temperature} humidity={latestData.humidity} />
        </div>
      )}

      {/* Quick Actions Section */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setActions({ ...actions, fanOn: !actions.fanOn })}
            className={`p-4 rounded-lg border-2 transition-all ${
              actions.fanOn
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-white hover:border-blue-300'
            }`}>
            <Wind className={`w-6 h-6 mx-auto mb-2 ${actions.fanOn ? 'text-blue-500' : 'text-gray-400'}`} />
            <p className="text-sm font-medium text-gray-700">Turn On Fan</p>
            <p className="text-xs text-gray-500 mt-1">{actions.fanOn ? 'ON' : 'OFF'}</p>
          </button>

          <button
            onClick={() => setActions({ ...actions, windowOpen: !actions.windowOpen })}
            className={`p-4 rounded-lg border-2 transition-all ${
              actions.windowOpen
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 bg-white hover:border-green-300'
            }`}>
            <Wind className={`w-6 h-6 mx-auto mb-2 ${actions.windowOpen ? 'text-green-500' : 'text-gray-400'}`} />
            <p className="text-sm font-medium text-gray-700">Open Windows</p>
            <p className="text-xs text-gray-500 mt-1">{actions.windowOpen ? 'OPEN' : 'CLOSED'}</p>
          </button>
        </div>
      </div>

      {/* Alerts and Thresholds Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Alerts Panel */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <h2 className="text-base md:text-lg font-semibold text-gray-800">Alerts ({alerts.length})</h2>
            </div>
            <button
              onClick={() => setShowAlertForm(!showAlertForm)}
              className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 transition-all"
              title="Create Alert">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {showAlertForm && (
            <div className="mb-4 p-3 border border-blue-300 rounded-lg bg-blue-50">
              <textarea
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                placeholder="Alert message..."
                className="w-full p-2 border rounded text-sm mb-2"
                rows={2}
              />
              <div className="flex gap-2 mb-2">
                <select
                  value={alertSeverity}
                  onChange={(e) => setAlertSeverity(e.target.value)}
                  className="flex-1 p-2 border rounded text-sm">
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="danger">Danger</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addManualAlert}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700">
                  Create
                </button>
                <button
                  onClick={() => setShowAlertForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm font-medium hover:bg-gray-400">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-sm text-gray-500">No alerts</p>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg text-sm ${
                    alert.severity === 'danger'
                      ? 'bg-red-50 border border-red-200'
                      : alert.severity === 'warning'
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-blue-50 border border-blue-200'
                  }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      {alert.type === 'auto' && <span className="text-xs font-semibold text-gray-500">AUTO • </span>}
                      <p className="text-gray-800">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{alert.timestamp}</p>
                    </div>
                    <button
                      onClick={() => removeAlert(alert.id)}
                      className="text-gray-400 hover:text-gray-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Threshold Settings */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-semibold text-gray-800">Thresholds</h2>
            <button
              onClick={() => setShowThresholdForm(!showThresholdForm)}
              className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 transition-all"
              title="Edit Thresholds">
              <Eye className="w-4 h-4" />
            </button>
          </div>

          {showThresholdForm && (
            <div className="mb-4 p-3 border border-blue-300 rounded-lg bg-blue-50 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700">Max Temperature (°C)</label>
                <input
                  type="number"
                  value={thresholds.maxTemp}
                  onChange={(e) => setThresholds({ ...thresholds, maxTemp: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Min Temperature (°C)</label>
                <input
                  type="number"
                  value={thresholds.minTemp}
                  onChange={(e) => setThresholds({ ...thresholds, minTemp: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Max Humidity (%)</label>
                <input
                  type="number"
                  value={thresholds.maxHumidity}
                  onChange={(e) => setThresholds({ ...thresholds, maxHumidity: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Min Humidity (%)</label>
                <input
                  type="number"
                  value={thresholds.minHumidity}
                  onChange={(e) => setThresholds({ ...thresholds, minHumidity: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded text-sm mt-1"
                />
              </div>
              <button
                onClick={() => setShowThresholdForm(false)}
                className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700">
                Done
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <p className="text-xs font-semibold text-gray-600">Max Temperature</p>
              <p className="text-xl font-bold text-orange-600">{thresholds.maxTemp}°C</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-xs font-semibold text-gray-600">Min Temperature</p>
              <p className="text-xl font-bold text-blue-600">{thresholds.minTemp}°C</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p className="text-xs font-semibold text-gray-600">Max Humidity</p>
              <p className="text-xl font-bold text-yellow-600">{thresholds.maxHumidity}%</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-xs font-semibold text-gray-600">Min Humidity</p>
              <p className="text-xl font-bold text-green-600">{thresholds.minHumidity}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Reports */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-800">Environmental Trends - Last 24 Hours</h2>
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all">
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>
        
        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={350} className="md:h-[450px]">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" stroke="#6B7280" style={{ fontSize: '10px' }} />
              <YAxis 
                stroke="#6B7280" 
                style={{ fontSize: '10px' }}
                label={{ value: 'Temperature (°C) / Humidity (%)', angle: -90, position: 'insideLeft', style: { fontSize: '10px' } }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '11px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line 
                type="monotone" 
                dataKey="temp" 
                stroke="#F97316" 
                strokeWidth={2}
                dot={false}
                name="Temperature (°C)"
              />
              <Line 
                type="monotone" 
                dataKey="humidity" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={false}
                name="Humidity (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Summary Statistics */}
      {latestData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <StatCard
            icon={ThermometerSun}
            title="Max Temperature"
            value={stats.maxTemp}
            unit="°C"
            color="bg-orange-100"
          />
          <StatCard
            icon={ThermometerSun}
            title="Min Temperature"
            value={stats.minTemp}
            unit="°C"
            color="bg-blue-100"
          />
          <StatCard
            icon={Droplets}
            title="Avg Humidity"
            value={stats.avgHumidity}
            unit="%"
            color="bg-blue-50"
          />
        </div>
      )}
    </div>
  );
}