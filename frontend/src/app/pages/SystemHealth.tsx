import { Activity, Cpu, HardDrive, Wifi, Battery } from 'lucide-react';

const systemMetrics = [
  { name: 'CPU Usage', value: 45, max: 100, icon: Cpu, color: 'bg-blue-500', unit: '%' },
  { name: 'Memory Usage', value: 62, max: 100, icon: HardDrive, color: 'bg-green-500', unit: '%' },
  { name: 'Network Signal', value: 85, max: 100, icon: Wifi, color: 'bg-purple-500', unit: '%' },
  { name: 'Battery Level', value: 78, max: 100, icon: Battery, color: 'bg-yellow-500', unit: '%' },
];

const sensors = [
  { name: 'Soil Moisture Sensor', status: 'Online', health: 98, lastUpdate: '2 min ago' },
  { name: 'Temperature Sensor', status: 'Online', health: 100, lastUpdate: '1 min ago' },
  { name: 'Humidity Sensor', status: 'Online', health: 95, lastUpdate: '3 min ago' },
  { name: 'Motion Detector', status: 'Online', health: 92, lastUpdate: '1 min ago' },
  { name: 'Irrigation Pump', status: 'Standby', health: 100, lastUpdate: '5 min ago' },
];

export default function SystemHealth() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <Activity className="w-4 h-4 md:w-5 md:h-5 text-[#2E7D32]" />
          <h2 className="text-base md:text-lg font-semibold text-gray-800">Overall System Health</h2>
        </div>
        <div className="text-center py-4 md:py-6">
          <div className="text-5xl md:text-6xl font-bold text-green-600">96%</div>
          <p className="text-gray-600 mt-2 text-sm md:text-base">All systems operational</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {systemMetrics.map((metric) => {
          const Icon = metric.icon;
          const percentage = (metric.value / metric.max) * 100;
          
          return (
            <div key={metric.name} className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <Icon className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                <h3 className="text-xs md:text-sm font-medium text-gray-700">{metric.name}</h3>
              </div>
              <div className="mb-2">
                <div className="flex items-end gap-1">
                  <span className="text-2xl md:text-3xl font-bold text-gray-800">{metric.value}</span>
                  <span className="text-base md:text-lg text-gray-500 mb-1">{metric.unit}</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${metric.color} transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
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
              {sensors.map((sensor) => (
                <tr key={sensor.name} className="hover:bg-gray-50">
                  <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-800">{sensor.name}</td>
                  <td className="px-3 md:px-4 py-2 md:py-3">
                    <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium ${
                      sensor.status === 'Online' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {sensor.status}
                    </span>
                  </td>
                  <td className="px-3 md:px-4 py-2 md:py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[80px] md:max-w-[100px]">
                        <div 
                          className="h-2 rounded-full bg-green-500"
                          style={{ width: `${sensor.health}%` }}
                        ></div>
                      </div>
                      <span className="text-xs md:text-sm text-gray-700">{sensor.health}%</span>
                    </div>
                  </td>
                  <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600">{sensor.lastUpdate}</td>
                </tr>
              ))}
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
              <span className="text-xs md:text-sm font-medium text-gray-800">SPM-2024-001</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs md:text-sm text-gray-600">Firmware Version</span>
              <span className="text-xs md:text-sm font-medium text-gray-800">v2.5.1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs md:text-sm text-gray-600">Uptime</span>
              <span className="text-xs md:text-sm font-medium text-gray-800">15 days 8 hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs md:text-sm text-gray-600">Last Reboot</span>
              <span className="text-xs md:text-sm font-medium text-gray-800">Feb 23, 2026</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="font-semibold text-gray-800 mb-3 md:mb-4 text-sm md:text-base">Maintenance</h3>
          <div className="space-y-2 md:space-y-3">
            <div className="flex justify-between">
              <span className="text-xs md:text-sm text-gray-600">Last Calibration</span>
              <span className="text-xs md:text-sm font-medium text-gray-800">Mar 1, 2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs md:text-sm text-gray-600">Next Calibration</span>
              <span className="text-xs md:text-sm font-medium text-orange-600">Mar 31, 2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs md:text-sm text-gray-600">Sensor Cleaning</span>
              <span className="text-xs md:text-sm font-medium text-gray-800">Feb 28, 2026</span>
            </div>
            <button className="w-full mt-2 py-2 px-4 bg-[#2E7D32] text-white font-medium rounded-lg hover:bg-[#1B5E20] transition-colors text-sm md:text-base">
              Schedule Maintenance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}