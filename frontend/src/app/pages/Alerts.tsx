import { AlertTriangle, AlertCircle, Info, CheckCircle, Filter } from 'lucide-react';
import { useState } from 'react';

const allAlerts = [
  {
    id: 1,
    severity: 'critical',
    category: 'Soil Moisture',
    message: 'Critical: Soil moisture at 25%. Immediate irrigation required.',
    time: '30 min ago',
    resolved: false,
  },
  {
    id: 2,
    severity: 'warning',
    category: 'Temperature',
    message: 'Warning: Temperature approaching upper threshold (29°C).',
    time: '1 hour ago',
    resolved: false,
  },
  {
    id: 3,
    severity: 'warning',
    category: 'Soil Moisture',
    message: 'Soil moisture dropped below 30%. Irrigation recommended.',
    time: '2 hours ago',
    resolved: true,
  },
  {
    id: 4,
    severity: 'info',
    category: 'Irrigation',
    message: 'Irrigation cycle completed successfully. Duration: 15 minutes.',
    time: '4 hours ago',
    resolved: false,
  },
  {
    id: 5,
    severity: 'success',
    category: 'Soil Moisture',
    message: 'Soil moisture levels optimal for plant growth.',
    time: '6 hours ago',
    resolved: false,
  },
  {
    id: 6,
    severity: 'warning',
    category: 'System',
    message: 'Network latency detected. Response time: 250ms.',
    time: '8 hours ago',
    resolved: true,
  },
  {
    id: 7,
    severity: 'warning',
    category: 'Air Quality',
    message: 'AQI reached level 4 (Poor). Ventilation recommended.',
    time: '10 hours ago',
    resolved: false,
  },
  {
    id: 8,
    severity: 'info',
    category: 'Light',
    message: 'Daily Light Integral below target. Consider supplemental lighting.',
    time: '12 hours ago',
    resolved: false,
  },
  {
    id: 9,
    severity: 'critical',
    category: 'Pump Safety',
    message: 'Pump blocked — soil moisture at 96%. Safety override active.',
    time: '14 hours ago',
    resolved: true,
  },
];

export default function Alerts() {
  const [filter, setFilter] = useState('all');

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500" />;
      default:
        return <Info className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const filteredAlerts = allAlerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'unresolved') return !alert.resolved;
    return alert.severity === filter;
  });

  const criticalCount = allAlerts.filter(a => a.severity === 'critical' && !a.resolved).length;
  const warningCount = allAlerts.filter(a => a.severity === 'warning' && !a.resolved).length;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
            <h3 className="text-xs md:text-sm font-medium text-gray-600">Critical</h3>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-red-600">{criticalCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
            <h3 className="text-xs md:text-sm font-medium text-gray-600">Warning</h3>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-orange-600">{warningCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
            <h3 className="text-xs md:text-sm font-medium text-gray-600">Info</h3>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-blue-600">
            {allAlerts.filter(a => a.severity === 'info').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
            <h3 className="text-xs md:text-sm font-medium text-gray-600">Resolved</h3>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-green-600">
            {allAlerts.filter(a => a.resolved).length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
          <h2 className="text-base md:text-lg font-semibold text-gray-800">Alert History</h2>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
            >
              <option value="all">All Alerts</option>
              <option value="unresolved">Unresolved</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
            </select>
          </div>
        </div>

        <div className="space-y-2 md:space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 md:p-4 rounded-lg border ${getSeverityColor(alert.severity)} ${
                alert.resolved ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-2 md:gap-3">
                {getSeverityIcon(alert.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-600 uppercase">
                      {alert.category}
                    </span>
                    {alert.resolved && (
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                        Resolved
                      </span>
                    )}
                  </div>
                  <p className="text-xs md:text-sm font-medium text-gray-800 break-words">{alert.message}</p>
                  <p className="text-xs text-gray-600 mt-1">{alert.time}</p>
                </div>
                {!alert.resolved && (
                  <button className="px-2 md:px-3 py-1 bg-[#2E7D32] text-white text-xs font-medium rounded hover:bg-[#1B5E20] transition-colors flex-shrink-0">
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <h3 className="font-semibold text-gray-800 mb-3 md:mb-4 text-sm md:text-base">Alert Settings</h3>
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-700">Email Notifications</p>
              <p className="text-xs text-gray-500">Receive alerts via email</p>
            </div>
            <button className="w-12 h-6 bg-[#2E7D32] rounded-full relative flex-shrink-0">
              <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-700">Push Notifications</p>
              <p className="text-xs text-gray-500">Receive push notifications</p>
            </div>
            <button className="w-12 h-6 bg-[#2E7D32] rounded-full relative flex-shrink-0">
              <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-700">SMS Alerts</p>
              <p className="text-xs text-gray-500">Receive critical alerts via SMS</p>
            </div>
            <button className="w-12 h-6 bg-gray-300 rounded-full relative flex-shrink-0">
              <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
