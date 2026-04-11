import { AlertTriangle, Droplet, Info } from 'lucide-react';

const alerts = [
  {
    id: 1,
    severity: 'warning',
    message: 'Soil moisture dropped below 30%. Irrigation recommended.',
    time: '2 hours ago',
    icon: AlertTriangle,
  },
  {
    id: 2,
    severity: 'info',
    message: 'Irrigation cycle completed successfully.',
    time: '4 hours ago',
    icon: Droplet,
  },
  {
    id: 3,
    severity: 'normal',
    message: 'Soil moisture levels optimal for plant growth.',
    time: '6 hours ago',
    icon: Info,
  },
];

export default function AlertsPanel() {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      default:
        return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  const getIconColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500';
      case 'warning':
        return 'text-orange-500';
      default:
        return 'text-green-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">Soil Moisture Alerts</h2>
      
      <div className="space-y-2 md:space-y-3">
        {alerts.map((alert) => {
          const Icon = alert.icon;
          return (
            <div
              key={alert.id}
              className={`p-3 md:p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start gap-2 md:gap-3">
                <Icon className={`w-4 h-4 md:w-5 md:h-5 mt-0.5 flex-shrink-0 ${getIconColor(alert.severity)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium break-words">{alert.message}</p>
                  <p className="text-xs opacity-75 mt-1">{alert.time}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}