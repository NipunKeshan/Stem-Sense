import { AlertTriangle, AlertCircle, Info, Filter, User, Cpu, Activity, Clock, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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

  const getSeverityIcon = (severity: string, type: string) => {
    if (severity === 'critical') return <AlertTriangle className="w-4 h-4" />;
    if (severity === 'warning') return <AlertCircle className="w-4 h-4" />;
    if (type === 'manual') return <User className="w-4 h-4" />;
    if (type === 'auto') return <Cpu className="w-4 h-4" />;
    return <Info className="w-4 h-4" />;
  };

  const getIconStyle = (severity: string, type: string) => {
    if (severity === 'critical') return { bg: 'bg-red-100', text: 'text-red-600' };
    if (severity === 'warning') return { bg: 'bg-amber-100', text: 'text-amber-600' };
    if (type === 'manual') return { bg: 'bg-blue-100', text: 'text-blue-600' };
    if (type === 'auto') return { bg: 'bg-purple-100', text: 'text-purple-600' };
    return { bg: 'bg-emerald-100', text: 'text-emerald-600' };
  };

  const getCardAccent = (severity: string, type: string) => {
    if (severity === 'critical') return 'border-l-red-500';
    if (severity === 'warning') return 'border-l-amber-500';
    if (type === 'manual') return 'border-l-blue-500';
    if (type === 'auto') return 'border-l-purple-500';
    return 'border-l-emerald-500';
  };

  const formatTime = (timestamp: string) => {
    const d = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' at ' +
           d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.severity === filter || alert.type === filter;
  });

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const manualCount = alerts.filter(a => a.type === 'manual').length;
  const autoCount = alerts.filter(a => a.type === 'auto').length;

  // Group alerts by day
  const groupedAlerts: { [key: string]: any[] } = {};
  filteredAlerts.forEach(alert => {
    const d = new Date(alert.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key: string;
    if (d.toDateString() === today.toDateString()) {
      key = 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday';
    } else {
      key = d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    }

    if (!groupedAlerts[key]) groupedAlerts[key] = [];
    groupedAlerts[key].push(alert);
  });

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <button
          onClick={() => setFilter(filter === 'critical' ? 'all' : 'critical')}
          className={`group bg-white rounded-xl shadow-sm border p-4 md:p-5 text-left transition-all duration-200 hover:shadow-md ${
            filter === 'critical' ? 'ring-2 ring-red-400 border-red-200' : 'border-gray-100 hover:border-red-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            {criticalCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{criticalCount}</p>
          <p className="text-xs font-medium text-gray-500 mt-0.5">Critical</p>
        </button>

        <button
          onClick={() => setFilter(filter === 'warning' ? 'all' : 'warning')}
          className={`group bg-white rounded-xl shadow-sm border p-4 md:p-5 text-left transition-all duration-200 hover:shadow-md ${
            filter === 'warning' ? 'ring-2 ring-amber-400 border-amber-200' : 'border-gray-100 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{warningCount}</p>
          <p className="text-xs font-medium text-gray-500 mt-0.5">Warnings</p>
        </button>

        <button
          onClick={() => setFilter(filter === 'manual' ? 'all' : 'manual')}
          className={`group bg-white rounded-xl shadow-sm border p-4 md:p-5 text-left transition-all duration-200 hover:shadow-md ${
            filter === 'manual' ? 'ring-2 ring-blue-400 border-blue-200' : 'border-gray-100 hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <User className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{manualCount}</p>
          <p className="text-xs font-medium text-gray-500 mt-0.5">Manual</p>
        </button>

        <button
          onClick={() => setFilter(filter === 'auto' ? 'all' : 'auto')}
          className={`group bg-white rounded-xl shadow-sm border p-4 md:p-5 text-left transition-all duration-200 hover:shadow-md ${
            filter === 'auto' ? 'ring-2 ring-purple-400 border-purple-200' : 'border-gray-100 hover:border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <Cpu className="w-4 h-4 text-purple-500" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{autoCount}</p>
          <p className="text-xs font-medium text-gray-500 mt-0.5">Automated</p>
        </button>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Activity className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-semibold text-gray-800">Activity Timeline</h2>
              <p className="text-[11px] text-gray-400">{alerts.length} total events logged</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="text-[11px] font-medium text-[#2E7D32] hover:underline"
              >
                Clear filter
              </button>
            )}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-transparent text-xs font-medium text-gray-600 focus:outline-none cursor-pointer pr-1"
              >
                <option value="all">All Activity</option>
                <option value="critical">Critical</option>
                <option value="warning">Warnings</option>
                <option value="manual">Manual</option>
                <option value="auto">Automated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="divide-y divide-gray-50">
          {loading && alerts.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-[#2E7D32] rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Loading activity timeline...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="py-16 text-center">
              <Zap className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-400">No activity yet</p>
              <p className="text-xs text-gray-300 mt-1">
                {filter !== 'all' ? 'Try changing the filter above' : 'Events will appear here when they occur'}
              </p>
            </div>
          ) : (
            Object.entries(groupedAlerts).map(([dayLabel, dayAlerts]) => (
              <div key={dayLabel}>
                {/* Day Header */}
                <div className="px-5 py-2 bg-gray-50/70 flex items-center gap-2">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{dayLabel}</span>
                  <span className="text-[10px] text-gray-300 font-medium">({dayAlerts.length})</span>
                </div>

                {/* Day Events */}
                {dayAlerts.map((alert) => {
                  const style = getIconStyle(alert.severity, alert.type);
                  return (
                    <div
                      key={alert._id}
                      className={`px-5 py-3.5 border-l-[3px] hover:bg-gray-50/50 transition-colors ${getCardAccent(alert.severity, alert.type)}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                          <span className={style.text}>
                            {getSeverityIcon(alert.severity, alert.type)}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-gray-800 leading-snug">{alert.message}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              alert.type === 'manual' ? 'bg-blue-50 text-blue-600' :
                              alert.type === 'auto' ? 'bg-purple-50 text-purple-600' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {alert.type === 'manual' ? 'Manual' : alert.type === 'auto' ? 'ML Engine' : 'System'}
                            </span>
                            <span className="text-[11px] text-gray-400">{formatTime(alert.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
