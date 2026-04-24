import React, { useState, useEffect } from 'react';
import { Droplets, ThermometerSun, Wind, Sun, Power, TrendingUp, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

import StatCard from '../components/StatCard';

const SOIL_SAFETY_THRESHOLD = 95;

export default function Overview() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [latestData, setLatestData] = useState<any | null>(null);
  const [desiredPumpState, setDesiredPumpState] = useState<number | null>(null);
  const [pumpLoading, setPumpLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/sensors');
        if (res.data.success) {
          const rawData = res.data.data;
          
          if (rawData.length > 0) {
            setLatestData(rawData[0]);
          }
          if (res.data.desired_pump_state !== undefined) {
            setDesiredPumpState(res.data.desired_pump_state);
          }

          const chartData = [...rawData].reverse().slice(-100).map((item: any) => {
            const d = new Date(item.timestamp);
            return {
              time: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
              moisture: item.soil_moisture || 0,
              temp: item.temperature || 0,
              aqi: item.aqi || 0,
            };
          });
          setData(chartData);
        }
      } catch (err) {
        console.error('Error fetching sensor data', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handlePumpToggle = async (state: number) => {
    try {
      setPumpLoading(true);
      await axios.post('http://localhost:5000/api/sensors/pump', { pump: state });
      setDesiredPumpState(state);
      // Refresh data to show new state
      const res = await axios.get('http://localhost:5000/api/sensors/latest');
      if (res.data.success) {
        setLatestData((prev: any) => ({ ...prev, pump_state: state }));
        if (res.data.desired_pump_state !== undefined) {
          setDesiredPumpState(res.data.desired_pump_state);
        }
      }
    } catch (err) {
      console.error('Error toggling pump', err);
    } finally {
      setPumpLoading(false);
    }
  };

  const isSoilSaturated = (latestData?.soil_moisture || 0) >= SOIL_SAFETY_THRESHOLD;
  const pumpIsOn = desiredPumpState !== null ? desiredPumpState === 1 : latestData?.pump_state === 1;

  const getAQILabel = (aqi: number) => {
    if (aqi <= 1) return 'Excellent';
    if (aqi <= 2) return 'Good';
    if (aqi <= 3) return 'Fair';
    if (aqi <= 4) return 'Poor';
    return 'Hazardous';
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Safety Override Banner */}
      {isSoilSaturated && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
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
          value={latestData?.soil_moisture ?? "0"}
          unit="%"
          color="bg-[#2E7D32]"
        />
        <StatCard
          icon={ThermometerSun}
          title="Temperature"
          value={latestData?.temperature ?? "0"}
          unit="°C"
          color="bg-orange-500"
        />
        <StatCard
          icon={Droplets}
          title="Humidity"
          value={latestData?.humidity ?? "0"}
          unit="%"
          color="bg-blue-500"
        />
        <StatCard
          icon={Wind}
          title="Air Quality"
          value={latestData?.aqi ?? "0"}
          unit={getAQILabel(latestData?.aqi || 0)}
          color="bg-emerald-500"
        />
        <StatCard
          icon={Sun}
          title="Light"
          value={latestData?.lux ?? "0"}
          unit="lux"
          color="bg-yellow-500"
        />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-4 md:mb-6">System Overview — Live History</h2>
        <ResponsiveContainer width="100%" height={250} className="md:h-[350px]">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#2E7D32" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="time" stroke="#6B7280" style={{ fontSize: '10px' }} className="md:text-xs" />
            <YAxis stroke="#6B7280" style={{ fontSize: '10px' }} className="md:text-xs" />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Area 
              type="monotone" 
              dataKey="moisture" 
              stroke="#2E7D32" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorMoisture)" 
              name="Moisture %"
            />
            <Area 
              type="monotone" 
              dataKey="temp" 
              stroke="#F97316" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorTemp)"
              name="Temperature °C"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Pump Control */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="font-semibold text-gray-800 mb-3 md:mb-4 text-sm md:text-base">Pump Control</h3>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
            <div className="flex items-center gap-3">
              <Power className={`w-6 h-6 ${pumpIsOn ? 'text-green-600' : 'text-gray-400'}`} />
              <div>
                <p className="text-sm font-medium text-gray-700">Pump Status</p>
                <p className={`text-lg font-semibold ${pumpIsOn ? 'text-green-600' : 'text-gray-500'}`}>
                  {pumpIsOn ? 'ON' : 'OFF'}
                </p>
              </div>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              pumpIsOn ? 'bg-green-100' : 'bg-gray-200'
            }`}>
              <div className={`w-6 h-6 rounded-full ${
                pumpIsOn ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`} />
            </div>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => handlePumpToggle(1)}
              disabled={pumpIsOn || pumpLoading || isSoilSaturated}
              className="w-full py-2.5 px-4 bg-[#2E7D32] text-white font-medium rounded-lg hover:bg-[#1B5E20] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              {isSoilSaturated ? '⚠ Blocked — Soil Saturated' : 'Start Pump'}
            </button>
            <button
              onClick={() => handlePumpToggle(0)}
              disabled={!pumpIsOn || pumpLoading}
              className="w-full py-2.5 px-4 bg-[#C62828] text-white font-medium rounded-lg hover:bg-[#B71C1C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              Stop Pump
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="font-semibold text-gray-800 mb-3 md:mb-4 text-sm md:text-base">System Status</h3>
          <div className="space-y-2 md:space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-gray-600">Soil Sensor</span>
              <span className="text-xs md:text-sm font-medium text-green-600">● Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-gray-600">AHT21 (Temp/Humidity)</span>
              <span className="text-xs md:text-sm font-medium text-green-600">● Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-gray-600">ENS160 (Air Quality)</span>
              <span className="text-xs md:text-sm font-medium text-green-600">● Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-gray-600">BH1750 (Light)</span>
              <span className="text-xs md:text-sm font-medium text-green-600">● Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-gray-600">Irrigation Pump</span>
              <span className={`text-xs md:text-sm font-medium ${pumpIsOn ? 'text-green-600' : 'text-gray-500'}`}>
                ● {pumpIsOn ? 'Running' : 'Standby'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-gray-600">Network Connection</span>
              <span className="text-xs md:text-sm font-medium text-green-600">● Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}