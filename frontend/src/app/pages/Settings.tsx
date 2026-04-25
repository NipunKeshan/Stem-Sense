import { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Database, Wifi, Save, X } from 'lucide-react';
import { Switch } from '../components/ui/switch';

export default function Settings() {
  const [notifications, setNotifications] = useState({
    lowMoisture: true,
    temperature: true,
    airQuality: true,
    lightLevel: false,
  });
  const [sensorConfig, setSensorConfig] = useState({
    moistureThreshold: 30,
    samplingInterval: 5,
  });
  const [networkConfig, setNetworkConfig] = useState({
    wifiSsid: 'PlantMonitor_Network',
    apiEndpoint: 'https://api.plantmonitor.local',
  });
  const [profileConfig, setProfileConfig] = useState({
    userName: 'Admin User',
    email: 'admin@plantmonitor.com',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In production this would POST to backend
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    setNotifications({ lowMoisture: true, temperature: true, airQuality: true, lightLevel: false });
    setSensorConfig({ moistureThreshold: 30, samplingInterval: 5 });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <SettingsIcon className="w-4 h-4 md:w-5 md:h-5 text-[#2E7D32]" />
          <h2 className="text-base md:text-lg font-semibold text-gray-800">System Settings</h2>
        </div>

        {saved && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium" role="alert">
            ✓ Settings saved successfully
          </div>
        )}

        <div className="space-y-4 md:space-y-6">
          {/* Profile Settings */}
          <div>
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <User className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-700 text-sm md:text-base">Profile Settings</h3>
            </div>
            <div className="pl-0 md:pl-7 space-y-3">
              <div>
                <label htmlFor="settings-username" className="block text-xs md:text-sm font-medium text-gray-600 mb-1">
                  User Name
                </label>
                <input
                  id="settings-username"
                  type="text"
                  value={profileConfig.userName}
                  onChange={(e) => setProfileConfig({ ...profileConfig, userName: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D32] text-sm md:text-base"
                />
              </div>
              <div>
                <label htmlFor="settings-email" className="block text-xs md:text-sm font-medium text-gray-600 mb-1">
                  Email
                </label>
                <input
                  id="settings-email"
                  type="email"
                  value={profileConfig.email}
                  onChange={(e) => setProfileConfig({ ...profileConfig, email: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D32] text-sm md:text-base"
                />
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="border-t pt-4 md:pt-6">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Bell className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-700 text-sm md:text-base">Notification Settings</h3>
            </div>
            <div className="pl-0 md:pl-7 space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="notif-moisture" className="text-xs md:text-sm text-gray-700 cursor-pointer">Low Moisture Alerts</label>
                <Switch
                  id="notif-moisture"
                  checked={notifications.lowMoisture}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, lowMoisture: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="notif-temp" className="text-xs md:text-sm text-gray-700 cursor-pointer">Temperature Alerts</label>
                <Switch
                  id="notif-temp"
                  checked={notifications.temperature}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, temperature: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="notif-air" className="text-xs md:text-sm text-gray-700 cursor-pointer">Air Quality Alerts</label>
                <Switch
                  id="notif-air"
                  checked={notifications.airQuality}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, airQuality: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="notif-light" className="text-xs md:text-sm text-gray-700 cursor-pointer">Light Level Alerts</label>
                <Switch
                  id="notif-light"
                  checked={notifications.lightLevel}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, lightLevel: checked })}
                />
              </div>
            </div>
          </div>

          {/* Sensor Configuration */}
          <div className="border-t pt-4 md:pt-6">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Database className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-700 text-sm md:text-base">Sensor Configuration</h3>
            </div>
            <div className="pl-0 md:pl-7 space-y-3">
              <div>
                <label htmlFor="moisture-threshold" className="block text-xs md:text-sm font-medium text-gray-600 mb-1">
                  Moisture Threshold (%)
                </label>
                <input
                  id="moisture-threshold"
                  type="number"
                  value={sensorConfig.moistureThreshold}
                  onChange={(e) => setSensorConfig({ ...sensorConfig, moistureThreshold: Number(e.target.value) })}
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D32] text-sm md:text-base"
                />
              </div>
              <div>
                <label htmlFor="sampling-interval" className="block text-xs md:text-sm font-medium text-gray-600 mb-1">
                  Sampling Interval (minutes)
                </label>
                <input
                  id="sampling-interval"
                  type="number"
                  value={sensorConfig.samplingInterval}
                  onChange={(e) => setSensorConfig({ ...sensorConfig, samplingInterval: Number(e.target.value) })}
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D32] text-sm md:text-base"
                />
              </div>
            </div>
          </div>

          {/* Network Settings */}
          <div className="border-t pt-4 md:pt-6">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Wifi className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-700 text-sm md:text-base">Network Settings</h3>
            </div>
            <div className="pl-0 md:pl-7 space-y-3">
              <div>
                <label htmlFor="wifi-ssid" className="block text-xs md:text-sm font-medium text-gray-600 mb-1">
                  Wi-Fi SSID
                </label>
                <input
                  id="wifi-ssid"
                  type="text"
                  value={networkConfig.wifiSsid}
                  onChange={(e) => setNetworkConfig({ ...networkConfig, wifiSsid: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D32] text-sm md:text-base"
                />
              </div>
              <div>
                <label htmlFor="api-endpoint" className="block text-xs md:text-sm font-medium text-gray-600 mb-1">
                  API Endpoint
                </label>
                <input
                  id="api-endpoint"
                  type="text"
                  value={networkConfig.apiEndpoint}
                  onChange={(e) => setNetworkConfig({ ...networkConfig, apiEndpoint: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D32] text-sm md:text-base"
                />
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="border-t pt-4 md:pt-6">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Shield className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-700 text-sm md:text-base">Security</h3>
            </div>
            <div className="pl-0 md:pl-7 space-y-2 md:space-y-3 flex flex-col sm:flex-row sm:gap-2">
              <button className="px-3 md:px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors text-sm md:text-base">
                Change Password
              </button>
              <button className="px-3 md:px-4 py-2 bg-[#2E7D32] text-white font-medium rounded-lg hover:bg-[#1B5E20] transition-colors text-sm md:text-base">
                Enable Two-Factor Auth
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t flex flex-col sm:flex-row gap-2 md:gap-3">
          <button
            onClick={handleSave}
            className="px-4 md:px-6 py-2.5 md:py-3 bg-[#2E7D32] text-white font-medium rounded-lg hover:bg-[#1B5E20] transition-colors text-sm md:text-base flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
          <button
            onClick={handleCancel}
            className="px-4 md:px-6 py-2.5 md:py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors text-sm md:text-base flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <h3 className="font-semibold text-gray-800 mb-3 md:mb-4 text-sm md:text-base">System Actions</h3>
        <div className="space-y-2">
          <button className="w-full py-2.5 md:py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-left text-sm md:text-base">
            Export Data
          </button>
          <button className="w-full py-2.5 md:py-3 px-4 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors text-left text-sm md:text-base">
            Factory Reset
          </button>
          <button className="w-full py-2.5 md:py-3 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors text-left text-sm md:text-base">
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
}
