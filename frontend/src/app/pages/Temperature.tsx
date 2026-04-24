import { useState, useEffect } from 'react';
import { ThermometerSun, Droplets, Download, Loader, Wifi } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush, ReferenceLine, ReferenceArea } from 'recharts';
import axios from 'axios';
import { downloadCSV } from '../../utils/export';
import StatCard from '../components/StatCard';

// Comfort Level Indicator
const ComfortLevelCard = ({ temperature, humidity }: { temperature: number; humidity: number }) => {
  const getComfortLevel = () => {
    const tempScore = Math.abs(temperature - 22) <= 2 ? 100 : Math.max(0, 100 - Math.abs(temperature - 22) * 15);
    const humidScore = humidity >= 30 && humidity <= 50 ? 100 : Math.max(0, 100 - Math.abs(humidity - 40) * 1.5);
    const overallScore = (tempScore + humidScore) / 2;
    
    if (overallScore >= 80) return { level: 'Excellent', color: 'bg-green-50 text-green-700', score: Math.round(overallScore) };
    if (overallScore >= 60) return { level: 'Good', color: 'bg-blue-50 text-blue-700', score: Math.round(overallScore) };
    if (overallScore >= 40) return { level: 'Fair', color: 'bg-yellow-50 text-yellow-700', score: Math.round(overallScore) };
    return { level: 'Poor', color: 'bg-red-50 text-red-700', score: Math.round(overallScore) };
  };

  const comfort = getComfortLevel();

  const getBarColor = () => {
    if (comfort.score >= 80) return 'bg-green-500';
    if (comfort.score >= 60) return 'bg-blue-500';
    if (comfort.score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`rounded-lg shadow-md p-4 md:p-6 ${comfort.color.split(' ')[0]}`}>
      <h3 className="text-sm font-medium text-gray-600 mb-3">Comfort Level</h3>
      <div className="text-center">
        <p className={`text-3xl md:text-4xl font-bold ${comfort.color.split(' ')[1]}`}>{comfort.score}%</p>
        <p className={`text-sm font-semibold mt-2 ${comfort.color.split(' ')[1]}`}>{comfort.level}</p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
          <div
            className={`h-2 rounded-full transition-all ${getBarColor()}`}
            style={{ width: `${comfort.score}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

type TimeRange = '30m' | '1h' | '6h' | '1d' | '7d';

export default function Temperature() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [latestData, setLatestData] = useState<any>(null);
  const [previousData, setPreviousData] = useState<any>(null);
  const [stats, setStats] = useState<any>({ maxTemp: 0, minTemp: 0, avgHumidity: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('30m');
  
  const downloadReport = () => {
    downloadCSV(chartData, `stemsense_temperature_${timeRange}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const resData = await axios.get('/api/sensors', { params: { timeRange } });
        if (resData.data.success && resData.data.data && resData.data.data.length > 0) {
          const allData = resData.data.data;
          setPreviousData(latestData);
          setLatestData(allData[0]);
          
          // Data is already filtered by backend
          const reversed = [...allData].reverse();
          const filtered = reversed;

          const processedData = filtered.map((item: any) => {
            const d = new Date(item.timestamp);
            return {
              time: timeRange === '7d'
                ? `${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
                : `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
              temp: item.temperature || 0,
              humidity: item.humidity || 0,
            };
          });
          setChartData(processedData);
        }

        const resStats = await axios.get('/api/sensors/stats');
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
  }, [timeRange]);

  if (loading && !latestData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading temperature data...</p>
        </div>
      </div>
    );
  }

  if (error && !latestData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-red-600">
          <p className="font-semibold">{error}</p>
          <p className="text-sm mt-2">Please make sure the backend is running.</p>
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

      {/* Charts with Time Range Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
          <h2 className="text-base md:text-lg font-semibold text-gray-800">Environmental Trends</h2>
          <div className="flex items-center gap-2">
            {/* Time Range Filter */}
            {(['30m', '1h', '6h', '1d', '7d'] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-[#2E7D32] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {range === '30m' ? '30 Min' : range === '1h' ? '1 Hour' : range === '6h' ? '6 Hours' : range === '1d' ? '1 Day' : '7 Days'}
              </button>
            ))}
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>
        
        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} />
              <XAxis dataKey="time" stroke="#9CA3AF" style={{ fontSize: '10px' }} />
              <YAxis 
                stroke="#9CA3AF" 
                style={{ fontSize: '10px' }}
                label={{ value: 'Temp (°C) / Humidity (%)', angle: -90, position: 'insideLeft', style: { fontSize: '10px' } }}
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
              {/* Optimal temperature range */}
              <ReferenceArea y1={20} y2={28} fill="#2E7D32" fillOpacity={0.05} 
                label={{ value: 'Optimal', position: 'insideTopLeft', fill: '#2E7D32', fontSize: 9 }} />
              <ReferenceLine y={30} stroke="#F97316" strokeDasharray="5 5" strokeOpacity={0.6}
                label={{ value: '30°C High', position: 'right', fill: '#F97316', fontSize: 9 }} />
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
              <Brush dataKey="time" height={25} stroke="#F97316" travellerWidth={8} />
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
            color="bg-orange-500"
          />
          <StatCard
            icon={ThermometerSun}
            title="Min Temperature"
            value={stats.minTemp}
            unit="°C"
            color="bg-blue-600"
          />
          <StatCard
            icon={Droplets}
            title="Avg Humidity"
            value={stats.avgHumidity}
            unit="%"
            color="bg-cyan-500"
          />
        </div>
      )}
    </div>
  );
}
