import React, { useState, useEffect } from 'react';
import { Droplets, ThermometerSun, Wind, Sun, AlertTriangle, Calendar, Download } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush, ReferenceLine } from 'recharts';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { downloadCSV } from '../../utils/export';

import StatCard from '../components/StatCard';
import IrrigationControl from '../components/IrrigationControl';

const SOIL_SAFETY_THRESHOLD = 95;

/**
 * Overview Page — Primary dashboard for greenhouse managers.
 * 
 * User Persona: Greenhouse Manager / Agricultural Decision-Maker
 * Analytical Goals:
 *   1. At-a-glance health check of all sensor systems
 *   2. Trend detection across moisture, temperature, and AQI
 *   3. Quick access to irrigation control
 *   4. System connectivity awareness
 * 
 * Visual Analytics:
 *   - Multiple coordinated stat cards (pre-attentive: color + size encoding)
 *   - Area chart with brush selection (interactive filtering)
 *   - Toggle-able series for drill-down comparison
 *   - Reference lines for safety thresholds (visual storytelling)
 *   - Real-time system status with computed sensor health
 */

type TimeRange = '30m' | '1h' | '6h' | '1d' | '7d';

export default function Overview() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [latestData, setLatestData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [resDataDesired, setResDataDesired] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30m');
  const [mlActive, setMlActive] = useState<{ accuracy: number } | null>(null);
  const [visibleSeries, setVisibleSeries] = useState({
    moisture: true,
    temp: true,
    aqi: false,
    humidity: false,
    lux: false,
  });

  const isSoilSaturated = (latestData?.soil_moisture || 0) >= SOIL_SAFETY_THRESHOLD;
  const pumpIsOn = (resDataDesired !== null ? resDataDesired === 1 : latestData?.pump_state === 1);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/sensors', { params: { timeRange } });
        if (res.data.success) {
          const rawData = res.data.data;
          
          if (rawData.length > 0) {
            setLatestData(rawData[0]);
          } else {
            // Fetch fallback latest data if time range is empty
            try {
              const latestRes = await axios.get('/api/sensors/latest');
              if (latestRes.data.success && latestRes.data.data) {
                setLatestData(latestRes.data.data);
              }
            } catch (e) {}
          }

          const reversed = [...rawData].reverse();
          // Backend now handles the timeRange filtering, we just map it for the chart
          const filtered = reversed;

          const chartData = filtered.map((item: any) => {
            const d = new Date(item.timestamp);
            return {
              time: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
              moisture: item.soil_moisture || 0,
              temp: item.temperature || 0,
              aqi: item.aqi || 0,
              humidity: item.humidity || 0,
              lux: item.lux || 0,
            };
          });
          setData(chartData);
        }
      } catch (err) {
        console.error('Error fetching sensor data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);

    const fetchPump = async () => {
      try {
        const res = await axios.get('/api/sensors/pump');
        if (res.data.success) {
          setResDataDesired(res.data.desired_pump_state);
        }
      } catch (e) {}
    };
    fetchPump();
    const inv = setInterval(fetchPump, 5000);
    
    return () => {
      clearInterval(interval);
      clearInterval(inv);
    };
  }, [timeRange]);

  // Fetch ML status once on mount
  useEffect(() => {
    const fetchML = async () => {
      try {
        const res = await axios.get('/api/sensors/ml-status');
        if (res.data.success) {
          setMlActive({ accuracy: res.data.model.accuracy });
        }
      } catch { setMlActive(null); }
    };
    fetchML();
  }, []);

  const getAQILabel = (aqi: number) => {
    if (aqi <= 1) return 'Excellent';
    if (aqi <= 2) return 'Good';
    if (aqi <= 3) return 'Fair';
    if (aqi <= 4) return 'Poor';
    return 'Hazardous';
  };

  const toggleSeries = (key: keyof typeof visibleSeries) => {
    setVisibleSeries(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Compute sensor health from latest data timestamp
  const getSensorHealth = () => {
    if (!latestData?.timestamp) return false;
    const diffSec = (Date.now() - new Date(latestData.timestamp).getTime()) / 1000;
    return diffSec < 30; // Consider "active" if data is < 30 seconds old
  };
  const isRecentData = getSensorHealth();

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Safety Override Banner */}
      {isSoilSaturated && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3" role="alert">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Safety Override Active</p>
            <p className="text-xs text-red-600">Soil moisture is ≥ {SOIL_SAFETY_THRESHOLD}%. Pump is blocked to prevent waterlogging.</p>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-6">
        <StatCard
          icon={Droplets}
          title="Soil Moisture"
          value={latestData?.soil_moisture ?? "—"}
          unit="%"
          color="bg-[#2E7D32]"
          loading={loading && !latestData}
        />
        <StatCard
          icon={ThermometerSun}
          title="Temperature"
          value={latestData?.temperature ?? "—"}
          unit="°C"
          color="bg-orange-500"
          loading={loading && !latestData}
        />
        <StatCard
          icon={Droplets}
          title="Humidity"
          value={latestData?.humidity ?? "—"}
          unit="%"
          color="bg-blue-500"
          loading={loading && !latestData}
        />
        <StatCard
          icon={Wind}
          title="Air Quality"
          value={latestData?.aqi ?? "—"}
          unit={getAQILabel(latestData?.aqi || 0)}
          color="bg-emerald-500"
          loading={loading && !latestData}
        />
        <StatCard
          icon={Sun}
          title="Light"
          value={latestData?.lux ?? "—"}
          unit="lux"
          color="bg-yellow-500"
          loading={loading && !latestData}
        />
      </div>

      {/* Coordinated Multi-Series Chart with Filtering */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
          <h2 className="text-base md:text-lg font-semibold text-gray-800">System Overview — Live Trends</h2>
          
          {/* Time Range Filter */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadCSV(data, `stemsense_overview_${timeRange}`)}
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

        {/* Series Toggle Buttons (Drill-Down Control) */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'moisture' as const, label: 'Moisture %', color: '#2E7D32' },
            { key: 'temp' as const, label: 'Temperature °C', color: '#F97316' },
            { key: 'aqi' as const, label: 'Air Quality', color: '#10B981' },
            { key: 'humidity' as const, label: 'Humidity %', color: '#3B82F6' },
            { key: 'lux' as const, label: 'Light (lux)', color: '#EAB308' },
          ].map(series => (
            <button
              key={series.key}
              onClick={() => toggleSeries(series.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                visibleSeries[series.key]
                  ? 'border-transparent text-white shadow-sm'
                  : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
              }`}
              style={visibleSeries[series.key] ? { backgroundColor: series.color } : {}}
              aria-pressed={visibleSeries[series.key]}
            >
              <span className={`w-2 h-2 rounded-full ${visibleSeries[series.key] ? 'bg-white/60' : ''}`} 
                style={!visibleSeries[series.key] ? { backgroundColor: series.color } : {}} />
              {series.label}
            </button>
          ))}
        </div>

        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
            <defs>
              <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#2E7D32" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorLux" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EAB308" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#EAB308" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} />
            <XAxis dataKey="time" stroke="#9CA3AF" style={{ fontSize: '10px' }} />
            <YAxis stroke="#9CA3AF" style={{ fontSize: '10px' }} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            {/* Optimal temperature reference band */}
            <ReferenceLine y={30} stroke="#F97316" strokeDasharray="5 5" strokeOpacity={0.4}
              label={{ value: '30°C', position: 'right', fill: '#F97316', fontSize: 9 }} />
            {visibleSeries.moisture && (
              <Area 
                type="monotone" 
                dataKey="moisture" 
                stroke="#2E7D32" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorMoisture)" 
                name="Moisture %"
              />
            )}
            {visibleSeries.temp && (
              <Area 
                type="monotone" 
                dataKey="temp" 
                stroke="#F97316" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorTemp)"
                name="Temperature °C"
              />
            )}
            {visibleSeries.aqi && (
              <Area 
                type="monotone" 
                dataKey="aqi" 
                stroke="#10B981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorAqi)"
                name="Air Quality"
              />
            )}
            {visibleSeries.humidity && (
              <Area 
                type="monotone" 
                dataKey="humidity" 
                stroke="#3B82F6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorHumidity)"
                name="Humidity %"
              />
            )}
            {visibleSeries.lux && (
              <Area 
                type="monotone" 
                dataKey="lux" 
                stroke="#EAB308" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorLux)"
                name="Light (lux)"
              />
            )}
            {/* Brush for interactive range selection (brushing & linking) */}
            <Brush dataKey="time" height={25} stroke="#2E7D32" travellerWidth={8} />
          </AreaChart>
        </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <p className="text-gray-500 text-sm">No data available in this time range.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Pump Control */}
        <div>
          <IrrigationControl />
        </div>

        {/* System Status — Computed from real data */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="font-semibold text-gray-800 mb-3 md:mb-4 text-sm md:text-base">System Status</h3>
          <div className="space-y-2 md:space-y-3">
            {[
              { name: 'Soil Sensor', key: 'soil_moisture' },
              { name: 'AHT21 (Temp/Humidity)', key: 'temperature' },
              { name: 'ENS160 (Air Quality)', key: 'aqi' },
              { name: 'BH1750 (Light)', key: 'lux' },
            ].map(sensor => {
              const hasData = latestData?.[sensor.key] !== undefined && latestData?.[sensor.key] !== null;
              const isActive = isRecentData && hasData;
              return (
                <div key={sensor.key} className="flex items-center justify-between">
                  <span className="text-xs md:text-sm text-gray-600">{sensor.name}</span>
                  <span className={`text-xs md:text-sm font-medium ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                    ● {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              );
            })}
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-gray-600">Irrigation Pump</span>
              <span className={`text-xs md:text-sm font-medium ${pumpIsOn ? 'text-green-600' : 'text-gray-500'}`}>
                ● {pumpIsOn ? 'Running' : 'Standby'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-gray-600">Network Connection</span>
              <span className={`text-xs md:text-sm font-medium ${isRecentData ? 'text-green-600' : 'text-red-500'}`}>
                ● {isRecentData ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-gray-600">ML Engine</span>
              <span className={`text-xs md:text-sm font-medium ${mlActive ? 'text-purple-600' : 'text-gray-400'}`}>
                ● {mlActive ? `Active (${(mlActive.accuracy * 100).toFixed(0)}% acc)` : 'Unavailable'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
