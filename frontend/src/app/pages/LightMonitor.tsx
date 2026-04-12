import React, { useState, useEffect } from 'react';
import { Sun, Sunrise, Loader, Lightbulb } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import axios from 'axios';
import StatCard from '../components/StatCard';

const getLightLevel = (lux: number) => {
  if (lux < 100) return { label: 'Low', color: '#6b7280', bg: 'bg-gray-100 text-gray-700' };
  if (lux < 500) return { label: 'Moderate', color: '#eab308', bg: 'bg-yellow-50 text-yellow-700' };
  if (lux < 2000) return { label: 'Bright', color: '#f97316', bg: 'bg-orange-50 text-orange-700' };
  return { label: 'Very Bright', color: '#ef4444', bg: 'bg-red-50 text-red-700' };
};

const DLI_TARGET_MIN = 12;
const DLI_TARGET_MAX = 20;

export default function LightMonitor() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [latestData, setLatestData] = useState<any>(null);
  const [stats, setStats] = useState<any>({ peakLux: 0, avgLux: 0, currentDLI: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightsOn, setLightsOn] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch readings for chart
        const resData = await axios.get('http://localhost:5000/api/sensors');
        if (resData.data.success && resData.data.data && resData.data.data.length > 0) {
          const allData = resData.data.data;
          setLatestData(allData[0]);

          const processedData = [...allData]
            .reverse()
            .slice(-24)
            .map((item: any) => {
              const d = new Date(item.timestamp);
              return {
                time: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
                lux: item.lux || 0,
                dli: item.dli || 0,
              };
            });
          setChartData(processedData);
        }

        // Fetch aggregate stats from backend (Holistic Fix)
        const resStats = await axios.get('http://localhost:5000/api/sensors/stats');
        if (resStats.data.success) {
          const s = resStats.data.data.lux;
          setStats({
            peakLux: s.max,
            avgLux: s.avg,
            currentDLI: resStats.data.data.dli.avg, // Use avg as current daily progress
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
  }, []);

  if (loading && !latestData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading light data...</p>
        </div>
      </div>
    );
  }

  if (error && !latestData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-red-600">
          <p className="font-semibold">{error}</p>
          <p className="text-sm mt-2">Ensure the backend is running at http://localhost:5000</p>
        </div>
      </div>
    );
  }

  const lightInfo = latestData ? getLightLevel(latestData.lux) : getLightLevel(0);
  const dliValue = parseFloat(stats.currentDLI) || 0;
  const dliProgress = Math.min((dliValue / DLI_TARGET_MAX) * 100, 100);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Main Metrics */}
      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatCard
          icon={Sun}
          title="Light Intensity"
          value={latestData?.lux ?? "-"}
          unit="lux"
          status={{
            label: lightInfo.label,
            type: lightInfo.label === 'Low' ? 'info' : lightInfo.label === 'Very Bright' ? 'danger' : 'warning'
          }}
          color="bg-yellow-500"
        />

        <StatCard
          icon={Sunrise}
          title="Daily Light Integral"
          value={dliValue}
          unit="mol/m²/day"
          status={{
            label: dliValue >= DLI_TARGET_MIN ? 'Stable' : 'Insufficient',
            type: dliValue >= DLI_TARGET_MIN ? 'success' : 'warning'
          }}
          color="bg-amber-500"
        />

        {/* Light Level Indicator - Full column on mobile, span elsewhere if needed */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 md:col-span-2 lg:col-span-1">
          <h3 className="text-xs md:text-sm font-semibold text-gray-500 mb-4 uppercase tracking-tight">Light Level Scale</h3>
          <div className="space-y-2">
            {[
              { label: 'Low', range: '< 100 lux', color: '#6b7280', min: 0, max: 100 },
              { label: 'Moderate', range: '100 – 500 lux', color: '#eab308', min: 100, max: 500 },
              { label: 'Bright', range: '500 – 2000 lux', color: '#f97316', min: 500, max: 2000 },
              { label: 'Very Bright', range: '> 2000 lux', color: '#ef4444', min: 2000, max: Infinity },
            ].map((level) => {
              const isActive = latestData && latestData.lux >= level.min && latestData.lux < level.max;
              return (
                <div
                  key={level.label}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                    isActive ? 'border-2 shadow-sm' : 'border-gray-100 opacity-50'
                  }`}
                  style={isActive ? { borderColor: level.color } : {}}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: level.color }} />
                    <span className="text-xs font-semibold text-gray-700">{level.label}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">{level.range}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-4 md:mb-6">Light Intensity Trend — Last 24 Readings</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorLux" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" stroke="#6B7280" style={{ fontSize: '10px' }} />
              <YAxis
                stroke="#6B7280"
                style={{ fontSize: '10px' }}
                label={{ value: 'Lux', angle: -90, position: 'insideLeft', style: { fontSize: '10px' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '11px',
                }}
                formatter={(value: number) => [`${value} lux`, 'Light']}
              />
              <Area
                type="monotone"
                dataKey="lux"
                stroke="#eab308"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorLux)"
                name="Light (lux)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary Stats */}
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <StatCard
          icon={Sunrise}
          title="Peak Light"
          value={stats.peakLux}
          unit="lux"
          color="bg-yellow-100"
        />
        <StatCard
          icon={Sun}
          title="Average Light"
          value={stats.avgLux}
          unit="lux"
          color="bg-amber-100"
        />
        <StatCard
          icon={Sunrise}
          title="Daily DLI"
          value={stats.currentDLI}
          unit="mol/m²"
          color="bg-orange-100"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="max-w-xs">
          <button
            onClick={() => setLightsOn(!lightsOn)}
            className={`w-full p-4 rounded-lg border-2 transition-all flex flex-col items-center ${
              lightsOn
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-gray-200 bg-white hover:border-yellow-200'
            }`}
          >
            <Lightbulb className={`w-6 h-6 mb-2 ${lightsOn ? 'text-yellow-500' : 'text-gray-400'}`} />
            <p className="text-sm font-medium text-gray-700">Turn On Lights</p>
            <p className="text-xs text-gray-500 mt-1">{lightsOn ? 'ON' : 'OFF'}</p>
          </button>
        </div>
      </div>
    </div>
  );
}
