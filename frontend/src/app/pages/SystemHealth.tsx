import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Wifi, Loader } from 'lucide-react';
import axios from 'axios';
import StatCard from '../components/StatCard';

const sensors = [
  { name: 'Soil Moisture Sensor', key: 'soil_moisture' },
  { name: 'AHT21 (Temperature & Humidity)', key: 'temperature' },
  { name: 'ENS160 (Air Quality)', key: 'aqi' },
  { name: 'BH1750 (Light Sensor)', key: 'lux' },
  { name: 'Irrigation Pump (Relay)', key: 'pump_state' },
];

export default function SystemHealth() {
  const [latestData, setLatestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/sensors/latest');
        if (res.data.success && res.data.data) {
          setLatestData(res.data.data);
          const d = new Date(res.data.data.timestamp);
          const now = new Date();
          const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
          if (diffSec < 60) {
            setTimeSinceUpdate(`${diffSec}s ago`);
          } else if (diffSec < 3600) {
            setTimeSinceUpdate(`${Math.floor(diffSec / 60)}m ago`);
          } else {
            setTimeSinceUpdate(`${Math.floor(diffSec / 3600)}h ago`);
          }
          setIsConnected(diffSec < 120);
        }
      } catch (err) {
        console.error('Error fetching system health', err);
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const getSensorStatus = (key: string) => {
    if (!latestData) return { status: 'Unknown', health: 0 };
    if (key === 'pump_state') {
      return { status: latestData.pump_state === 1 ? 'Running' : 'Standby', health: 100 };
    }
    const value = latestData[key];
    if (value !== undefined && value !== null) {
      return { status: 'Online', health: 100 };
    }
    return { status: 'Offline', health: 0 };
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <Activity className="w-4 h-4 md:w-5 md:h-5 text-[#2E7D32]" />
          <h2 className="text-base md:text-lg font-semibold text-gray-800">Overall System Health</h2>
        </div>
        <div className="text-center py-4 md:py-6">
          {loading ? (
            <Loader className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          ) : (
            <>
              <div className={`text-5xl md:text-6xl font-bold ${isConnected ? 'text-green-600' : 'text-red-500'}`}>
                {isConnected ? '100%' : 'Offline'}
              </div>
              <p className="text-gray-600 mt-2 text-sm md:text-base">
                {isConnected ? 'All systems operational' : 'Device not reporting data'}
              </p>
              {timeSinceUpdate && (
                <p className="text-xs text-gray-500 mt-1">Last data: {timeSinceUpdate}</p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatCard
          icon={Cpu}
          title="Device"
          value={latestData?.device_id || 'stemsense_node_01'}
          unit="ESP8266"
          color="bg-slate-600"
        />
        <StatCard
          icon={Wifi}
          title="Connection"
          value={isConnected ? 'Connected' : 'Disconnected'}
          status={{
            label: isConnected ? 'Online' : 'Offline',
            type: isConnected ? 'success' : 'danger'
          }}
          color={isConnected ? 'bg-green-600' : 'bg-red-500'}
        />
        <StatCard
          icon={Activity}
          title="Firmware"
          value="v2.1"
          unit="Production"
          color="bg-indigo-600"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">Sensor Status</h2>
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-600">Sensor Name</th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-600">Status</th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-600">Health</th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-600">Last Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sensors.map((sensor) => {
                const st = getSensorStatus(sensor.key);
                return (
                  <tr key={sensor.name} className="hover:bg-gray-50">
                    <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-800">{sensor.name}</td>
                    <td className="px-3 md:px-4 py-2 md:py-3">
                      <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium ${
                        st.status === 'Online' || st.status === 'Running'
                          ? 'bg-green-100 text-green-700' 
                          : st.status === 'Standby'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {st.status}
                      </span>
                    </td>
                    <td className="px-3 md:px-4 py-2 md:py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[80px] md:max-w-[100px]">
                          <div 
                            className={`h-2 rounded-full ${st.health === 100 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${st.health}%` }}
                          ></div>
                        </div>
                        <span className="text-xs md:text-sm text-gray-700">{st.health}%</span>
                      </div>
                    </td>
                    <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600">{timeSinceUpdate || '...'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="font-semibold text-gray-800 mb-3 md:mb-4 text-sm md:text-base">System Information</h3>
          <div className="space-y-2 md:space-y-3">
            <div className="flex justify-between">
              <span className="text-xs md:text-sm text-gray-600">Device ID</span>
              <span className="text-xs md:text-sm font-medium text-gray-800">{latestData?.device_id || 'stemsense_node_01'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs md:text-sm text-gray-600">Firmware Version</span>
              <span className="text-xs md:text-sm font-medium text-gray-800">StemSense v2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs md:text-sm text-gray-600">MCU</span>
              <span className="text-xs md:text-sm font-medium text-gray-800">ESP8266 NodeMCU</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs md:text-sm text-gray-600">I²C Bus</span>
              <span className="text-xs md:text-sm font-medium text-gray-800">SDA=D2, SCL=D5</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="font-semibold text-gray-800 mb-3 md:mb-4 text-sm md:text-base">Hardware Config</h3>
          <div className="space-y-2 md:space-y-3">
            <div className="flex justify-between">
              <span className="text-xs md:text-sm text-gray-600">Soil Calibration (Air)</span>
              <span className="text-xs md:text-sm font-medium text-gray-800">820</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs md:text-sm text-gray-600">Soil Calibration (Water)</span>
              <span className="text-xs md:text-sm font-medium text-gray-800">430</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs md:text-sm text-gray-600">Safety Threshold</span>
              <span className="text-xs md:text-sm font-medium text-red-600">95%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs md:text-sm text-gray-600">Relay Pin</span>
              <span className="text-xs md:text-sm font-medium text-gray-800">GPIO5 (D1)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}