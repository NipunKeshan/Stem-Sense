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
        const res = await axios.get('/api/sensors/latest');
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
          setIsConnected(diffSec < 30);
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
    if (!latestData || !isConnected) return { status: 'Offline', health: 0 };
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
    <div className="space-y-6">
      {/* Top Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Health Card */}
        <div className={`rounded-2xl shadow-lg p-6 text-white relative overflow-hidden ${
          isConnected ? 'bg-gradient-to-br from-[#1B5E20] to-[#2E7D32]' : 'bg-gradient-to-br from-red-800 to-red-600'
        }`}>
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold tracking-wide text-green-50">System Health</h2>
          </div>
          <div className="flex items-end gap-3 relative z-10">
            {loading ? (
              <Loader className="w-8 h-8 animate-spin text-white/70" />
            ) : (
              <>
                <div className="text-5xl font-bold tracking-tight">
                  {isConnected ? '100%' : 'OFF'}
                </div>
                <div className="mb-1">
                  <p className="text-sm font-medium text-green-100">
                    {isConnected ? 'All operational' : 'System offline'}
                  </p>
                  <p className="text-xs text-green-200 opacity-80">
                    {timeSinceUpdate ? `Updated ${timeSinceUpdate}` : 'Awaiting data...'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Connection Status Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isConnected ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                <Wifi className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-800">Connection</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800 mt-4">
              {isConnected ? 'Stable' : 'Disconnected'}
            </div>
            <p className="text-sm text-gray-500 mt-1">WebSocket / REST API</p>
          </div>
        </div>

        {/* Hardware Node Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-800">Hardware Node</h3>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              v2.1
            </span>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-800 mt-4 truncate" title={latestData?.device_id || 'stemsense_node_01'}>
              {latestData?.device_id || 'stemsense_node_01'}
            </div>
            <p className="text-sm text-gray-500 mt-1">ESP8266 Microcontroller</p>
          </div>
        </div>
      </div>

      {/* Sensor Diagnostics Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Sensor Diagnostics</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Component</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Health</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sensors.map((sensor) => {
                const st = getSensorStatus(sensor.key);
                return (
                  <tr key={sensor.name} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-4 py-4 text-sm font-medium text-gray-800">{sensor.name}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                        st.status === 'Online' || st.status === 'Running'
                          ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' 
                          : st.status === 'Standby'
                          ? 'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-500/10'
                          : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10'
                      }`}>
                        {st.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[120px] overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${st.health === 100 ? 'bg-[#2E7D32]' : 'bg-red-500'}`}
                            style={{ width: `${st.health}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-semibold text-gray-600 w-8">{st.health}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">{timeSinceUpdate || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-bold tracking-wide uppercase text-gray-500 mb-6">Software & Network</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-50">
              <span className="text-sm text-gray-600">Firmware Version</span>
              <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">v2.1.0-stable</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-50">
              <span className="text-sm text-gray-600">Protocol</span>
              <span className="text-sm font-medium text-gray-900">HTTP / REST</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-50">
              <span className="text-sm text-gray-600">Telemetry Rate</span>
              <span className="text-sm font-medium text-gray-900">5000ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">I²C Bus Mapping</span>
              <span className="text-sm font-medium text-gray-900">SDA=D2, SCL=D5</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-bold tracking-wide uppercase text-gray-500 mb-6">Hardware Calibration</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-50">
              <span className="text-sm text-gray-600">Soil Calibration (Air)</span>
              <span className="text-sm font-medium text-gray-900">820 ADC</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-50">
              <span className="text-sm text-gray-600">Soil Calibration (Water)</span>
              <span className="text-sm font-medium text-gray-900">430 ADC</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-50">
              <span className="text-sm text-gray-600">Safety Threshold limit</span>
              <span className="text-sm font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">95%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Relay Control Pin</span>
              <span className="text-sm font-medium text-gray-900">GPIO5 (D1)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
