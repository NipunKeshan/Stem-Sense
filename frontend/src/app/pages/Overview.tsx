import React, { useState, useEffect } from 'react';
import { Droplets, ThermometerSun, Radar, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ icon: Icon, title, value, unit, trend, color }: any) => (
  <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
    <div className="flex items-center justify-between mb-3 md:mb-4">
      <div className={`p-2 md:p-3 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
      </div>
      <div className="flex items-center gap-1 text-xs md:text-sm">
        <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
        <span className="text-green-600 font-medium">{trend}</span>
      </div>
    </div>
    <h3 className="text-gray-600 text-xs md:text-sm mb-1">{title}</h3>
    <p className="text-2xl md:text-3xl font-bold text-gray-800">
      {value}<span className="text-base md:text-lg text-gray-500 ml-1">{unit}</span>
    </p>
  </div>
);

export default function Overview() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [latestData, setLatestData] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/sensors');
        if (res.data.success) {
          const rawData = res.data.data;
          
          if (rawData.length > 0) {
            setLatestData(rawData[0]);
          }

          // Format for chart: Need chronological order (earliest to latest)
          const chartData = [...rawData].reverse().slice(-100).map((item: any) => {
            const d = new Date(item.timestamp);
            return {
              time: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
              moisture: item.soil_moisture || 0,
              temp: item.temperature || 0,
              humidity: item.humidity || 0,
              motionEvents: 0 // Mock property since motion might not be directly logged per reading
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

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard
          icon={Droplets}
          title="Soil Moisture"
          value={latestData?.soil_moisture || "0"}
          unit="%"
          trend="+5%"
          color="bg-[#2E7D32]"
        />
        <StatCard
          icon={ThermometerSun}
          title="Temperature"
          value={latestData?.temperature || "0"}
          unit="°C"
          trend="+2°C"
          color="bg-orange-500"
        />
        <StatCard
          icon={Droplets}
          title="Humidity"
          value={latestData?.humidity || "0"}
          unit="%"
          trend="-3%"
          color="bg-blue-500"
        />
        <StatCard
          icon={Radar}
          title="Motion Events"
          value={latestData?.motionCount || "0"}
          unit="today"
          trend="+4"
          color="bg-purple-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-4 md:mb-6">System Overview - Live History</h2>
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
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="font-semibold text-gray-800 mb-3 md:mb-4 text-sm md:text-base">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full py-2.5 md:py-3 px-4 bg-[#2E7D32] text-white font-medium rounded-lg hover:bg-[#1B5E20] transition-colors text-left text-sm md:text-base">
              Start Irrigation Cycle
            </button>
            <button className="w-full py-2.5 md:py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-left text-sm md:text-base">
              View Detailed Analytics
            </button>
            <button className="w-full py-2.5 md:py-3 px-4 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors text-left text-sm md:text-base">
              Download Report
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="font-semibold text-gray-800 mb-3 md:mb-4 text-sm md:text-base">System Status</h3>
          <div className="space-y-2 md:space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-gray-600">Soil Sensor</span>
              <span className="text-xs md:text-sm font-medium text-green-600">● Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-gray-600">Temperature Sensor</span>
              <span className="text-xs md:text-sm font-medium text-green-600">● Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-gray-600">Motion Detector</span>
              <span className="text-xs md:text-sm font-medium text-green-600">● Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-gray-600">Irrigation Pump</span>
              <span className="text-xs md:text-sm font-medium text-gray-500">● Standby</span>
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