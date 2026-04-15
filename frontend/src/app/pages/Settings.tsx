import { Settings as SettingsIcon, User, Bell, Shield, Database, Wifi } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <SettingsIcon className="w-4 h-4 md:w-5 md:h-5 text-[#2E7D32]" />
          <h2 className="text-base md:text-lg font-semibold text-gray-800">System Settings</h2>
        </div>

        <div className="space-y-4 md:space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <User className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-700 text-sm md:text-base">Profile Settings</h3>
            </div>
            <div className="pl-0 md:pl-7 space-y-3">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1">
                  User Name
                </label>
                <input
                  type="text"
                  defaultValue="Admin User"
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D32] text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue="admin@plantmonitor.com"
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D32] text-sm md:text-base"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4 md:pt-6">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Bell className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-700 text-sm md:text-base">Notification Settings</h3>
            </div>
            <div className="pl-0 md:pl-7 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm text-gray-700">Low Moisture Alerts</span>
                <button className="w-12 h-6 bg-[#2E7D32] rounded-full relative flex-shrink-0">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm text-gray-700">Temperature Alerts</span>
                <button className="w-12 h-6 bg-[#2E7D32] rounded-full relative flex-shrink-0">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm text-gray-700">Air Quality Alerts</span>
                <button className="w-12 h-6 bg-[#2E7D32] rounded-full relative flex-shrink-0">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm text-gray-700">Light Level Alerts</span>
                <button className="w-12 h-6 bg-gray-300 rounded-full relative flex-shrink-0">
                  <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                </button>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 md:pt-6">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Database className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-700 text-sm md:text-base">Sensor Configuration</h3>
            </div>
            <div className="pl-0 md:pl-7 space-y-3">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1">
                  Moisture Threshold (%)
                </label>
                <input
                  type="number"
                  defaultValue="30"
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D32] text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1">
                  Sampling Interval (minutes)
                </label>
                <input
                  type="number"
                  defaultValue="5"
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D32] text-sm md:text-base"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4 md:pt-6">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Wifi className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-700 text-sm md:text-base">Network Settings</h3>
            </div>
            <div className="pl-0 md:pl-7 space-y-3">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1">
                  Wi-Fi SSID
                </label>
                <input
                  type="text"
                  defaultValue="PlantMonitor_Network"
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D32] text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1">
                  API Endpoint
                </label>
                <input
                  type="text"
                  defaultValue="https://api.plantmonitor.local"
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E7D32] text-sm md:text-base"
                />
              </div>
            </div>
          </div>

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
          <button className="px-4 md:px-6 py-2.5 md:py-3 bg-[#2E7D32] text-white font-medium rounded-lg hover:bg-[#1B5E20] transition-colors text-sm md:text-base">
            Save Changes
          </button>
          <button className="px-4 md:px-6 py-2.5 md:py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors text-sm md:text-base">
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