import { useState, useEffect } from 'react';
import { Wind, Waves, Zap, Loader, AlertTriangle, Calendar, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush, ReferenceLine } from 'recharts';
import axios from 'axios';
import StatCard from '../components/StatCard';
import { downloadCSV } from '../../utils/export';

type TimeRange = '30m' | '1h' | '6h' | '1d' | '7d';

const getAQILabel = (aqi: number) => {
  if (aqi <= 1) return { label: 'Excellent', color: '#22c55e', bg: 'bg-green-50 text-green-700' };
  if (aqi <= 2) return { label: 'Good', color: '#3b82f6', bg: 'bg-blue-50 text-blue-700' };
  if (aqi <= 3) return { label: 'Fair', color: '#eab308', bg: 'bg-yellow-50 text-yellow-700' };
  if (aqi <= 4) return { label: 'Poor', color: '#f97316', bg: 'bg-orange-50 text-orange-700' };
  return { label: 'Hazardous', color: '#ef4444', bg: 'bg-red-50 text-red-700' };
};

const getTVOCStatus = (tvoc: number) => {
  if (tvoc <= 100) return 'text-green-700 bg-green-50';
  if (tvoc <= 300) return 'text-yellow-700 bg-yellow-50';
  return 'text-red-700 bg-red-50';
};

const getECO2Status = (eco2: number) => {
  if (eco2 <= 600) return 'text-green-700 bg-green-50';
  if (eco2 <= 1000) return 'text-yellow-700 bg-yellow-50';
  return 'text-red-700 bg-red-50';
};

export default function AirQuality() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [latestData, setLatestData] = useState<any>(null);
  const [stats, setStats] = useState<any>({ maxAqi: 0, avgTvoc: 0, avgEco2: 0, maxEco2: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('30m');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch chart data
        const resData = await axios.get('/api/sensors', { params: { timeRange } });
        if (resData.data.success && resData.data.data) {
          const allData = resData.data.data;
          if (allData.length > 0) {
            setLatestData(allData[0]);

            const reversed = [...allData].reverse();
            const processedData = reversed.map((item: any) => {
              const d = new Date(item.timestamp);
              return {
                time: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
                aqi: item.aqi || 0,
                tvoc: item.tvoc || 0,
                eco2: item.eco2 || 0,
              };
            });
            setChartData(processedData);
          } else {
            // Fetch fallback latest data if time range is empty
            try {
              const latestRes = await axios.get('/api/sensors/latest');
              if (latestRes.data.success && latestRes.data.data) {
                setLatestData(latestRes.data.data);
              }
            } catch (e) {}
            setChartData([]); // Clear chart data
          }
        }

        // Fetch stats from backend
        const resStats = await axios.get('/api/sensors/stats');
        if (resStats.data.success) {
          const s = resStats.data.data;
          setStats({
            maxAqi: s.aqi.max,
            avgTvoc: s.tvoc.avg,
            avgEco2: s.eco2.avg,
            maxEco2: s.eco2.max,
          });
        }
      } catch (err: any) {
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
          <p className="text-gray-600">Loading air quality data...</p>
        </div>
      </div>
    );
  }

  if (error && !latestData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-red-600">
          <p className="font-semibold">{error}</p>
          <p className="text-sm mt-2">Ensure the backend is running at </p>
        </div>
      </div>
    );
  }

  const aqiInfo = latestData ? getAQILabel(latestData.aqi) : getAQILabel(0);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* ENS160 Warm-up Notice */}
      {latestData && latestData.aqi === 0 && latestData.tvoc === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">ENS160 Sensor Warming Up</p>
            <p className="text-xs text-amber-600">The air quality sensor requires ~3 minutes to warm up. Data will appear once ready.</p>
          </div>
        </div>
      )}

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatCard
          icon={Wind}
          title="Air Quality"
          value={latestData?.aqi ?? "-"}
          unit={aqiInfo.label}
          status={{
            label: aqiInfo.label,
            type: latestData?.aqi <= 2 ? 'success' : latestData?.aqi <= 3 ? 'warning' : 'danger'
          }}
          color="bg-emerald-500"
        />

        <StatCard
          icon={Waves}
          title="Total VOC"
          value={latestData?.tvoc ?? "-"}
          unit="ppb"
          status={{
            label: (latestData?.tvoc || 0) <= 100 ? 'Clean' : (latestData?.tvoc || 0) <= 300 ? 'Moderate' : 'High',
            type: (latestData?.tvoc || 0) <= 100 ? 'success' : (latestData?.tvoc || 0) <= 300 ? 'warning' : 'danger'
          }}
          color="bg-purple-500"
        />

        <StatCard
          icon={Zap}
          title="Equivalent CO₂"
          value={latestData?.eco2 ?? "-"}
          unit="ppm"
          status={{
            label: (latestData?.eco2 || 0) <= 600 ? 'Normal' : (latestData?.eco2 || 0) <= 1000 ? 'Elevated' : 'High',
            type: (latestData?.eco2 || 0) <= 600 ? 'success' : (latestData?.eco2 || 0) <= 1000 ? 'warning' : 'danger'
          }}
          color="bg-rose-500"
        />
      </div>

      {/* Trend Chart */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
            <h2 className="text-base md:text-lg font-semibold text-gray-800">Air Quality Trends</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadCSV(chartData, `stemsense_airquality_${timeRange}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors mr-2"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
              <Calendar className="w-4 h-4 text-gray-400" />
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
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} />
                <XAxis dataKey="time" stroke="#6B7280" style={{ fontSize: '10px' }} />
                <YAxis
                  yAxisId="left"
                  stroke="#6B7280"
                  style={{ fontSize: '10px' }}
                  label={{ value: 'AQI', angle: -90, position: 'insideLeft', style: { fontSize: '10px' } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#6B7280"
                  style={{ fontSize: '10px' }}
                  label={{ value: 'TVOC / eCO₂', angle: 90, position: 'insideRight', style: { fontSize: '10px' } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <ReferenceLine yAxisId="right" y={600} stroke="#ef4444" strokeDasharray="5 5" strokeOpacity={0.5}
                  label={{ value: 'CO₂ 600ppm', position: 'right', fill: '#ef4444', fontSize: 9 }} />
                <Line yAxisId="left" type="monotone" dataKey="aqi" stroke="#22c55e" strokeWidth={2} dot={false} name="AQI" />
                <Line yAxisId="right" type="monotone" dataKey="tvoc" stroke="#a855f7" strokeWidth={2} dot={false} name="TVOC (ppb)" />
                <Line yAxisId="right" type="monotone" dataKey="eco2" stroke="#ef4444" strokeWidth={2} dot={false} name="eCO₂ (ppm)" />
                <Brush dataKey="time" height={25} stroke="#22c55e" travellerWidth={8} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[350px] bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <p className="text-gray-500 text-sm">No data available in this time range.</p>
            </div>
          )}
        </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          icon={Wind}
          title="Peak AQI"
          value={stats.maxAqi}
          color="bg-emerald-500"
        />
        <StatCard
          icon={Waves}
          title="Avg TVOC"
          value={stats.avgTvoc}
          unit="ppb"
          color="bg-purple-500"
        />
        <StatCard
          icon={Zap}
          title="Avg eCO₂"
          value={stats.avgEco2}
          unit="ppm"
          color="bg-rose-500"
        />
        <StatCard
          icon={Zap}
          title="Peak eCO₂"
          value={stats.maxEco2}
          unit="ppm"
          color="bg-rose-600"
        />
      </div>
    </div>
  );
}
