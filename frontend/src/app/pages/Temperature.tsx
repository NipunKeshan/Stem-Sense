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

  return (
    <div className="space-y-4 md:space-y-6">
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
              label: latestData.temperature > 30 ? 'High' : 'Normal',
              type: latestData.temperature > 30 ? 'danger' : 'success'
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
              label: latestData.humidity > 70 ? 'High' : 'Normal',
              type: latestData.humidity > 70 ? 'warning' : 'success'
            }}
            color="bg-blue-500"
          />

          <ComfortLevelCard temperature={latestData.temperature} humidity={latestData.humidity} />
        </div>
      )}



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