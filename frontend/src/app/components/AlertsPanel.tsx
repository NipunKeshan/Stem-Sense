import { useState, useEffect } from 'react';
import { AlertTriangle, Droplet, Info, User, Cpu } from 'lucide-react';
import axios from 'axios';

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await axios.get('/api/sensors/alerts');
        if (res.data.success) {
          setAlerts(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching alerts', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  const getIcon = (type: string, severity: string) => {
    if (severity === 'critical' || severity === 'warning') return AlertTriangle;
    if (type === 'manual') return User;
    if (type === 'auto') return Cpu;
    return Info;
  };

  const getIconColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500';
      case 'warning':
        return 'text-orange-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-green-500';
    }
  };

  const formatTime = (timestamp: string) => {
    const d = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">System Activity & Alerts</h2>
      
      <div className="space-y-2 md:space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {loading && alerts.length === 0 ? (
          <p className="text-sm text-gray-500">Loading alerts...</p>
        ) : alerts.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No recent activity detected.</p>
        ) : (
          alerts.map((alert) => {
            const Icon = getIcon(alert.type, alert.severity);
            return (
              <div
                key={alert._id}
                className={`p-3 md:p-4 rounded-lg border transition-all duration-300 hover:shadow-sm ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start gap-2 md:gap-3">
                  <Icon className={`w-4 h-4 md:w-5 md:h-5 mt-0.5 flex-shrink-0 ${getIconColor(alert.severity)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs md:text-sm font-medium break-words">{alert.message}</p>
                      {alert.type === 'manual' && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-100 px-1 rounded">Manual</span>
                      )}
                    </div>
                    <p className="text-[10px] md:text-xs opacity-75 mt-1">{formatTime(alert.timestamp)}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
