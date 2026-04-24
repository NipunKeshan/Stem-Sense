import { Bell, User, Menu, LogOut, Settings, AlertTriangle, Info, X, Cpu, User as UserIcon, CheckCheck, BellOff } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';

interface HeaderProps {
  onMenuClick: () => void;
}

const LAST_READ_KEY = 'stemsense_notifications_last_read';

export default function Header({ onMenuClick }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [lastReadAt, setLastReadAt] = useState<string | null>(
    () => localStorage.getItem(LAST_READ_KEY)
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationsOpen]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    const fetchAlerts = async () => {
      try {
        const res = await axios.get('/api/sensors/alerts');
        if (res.data.success) {
          setAlerts(res.data.data);
        }
      } catch (err) {
        // silently fail — header shouldn't break the page
      }
    };

    fetchAlerts();
    const alertInterval = setInterval(fetchAlerts, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(alertInterval);
    };
  }, []);

  const unreadCount = alerts.filter(a => {
    if (!lastReadAt) return true;
    return new Date(a.timestamp) > new Date(lastReadAt);
  }).length;

  const handleMarkAllRead = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(LAST_READ_KEY, now);
    setLastReadAt(now);
  }, []);

  const getIcon = (type: string, severity: string) => {
    if (severity === 'critical' || severity === 'warning') return AlertTriangle;
    if (type === 'manual') return UserIcon;
    if (type === 'auto') return Cpu;
    return Info;
  };

  const formatTime = (timestamp: string) => {
    const d = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const isUnread = (timestamp: string) => {
    if (!lastReadAt) return true;
    return new Date(timestamp) > new Date(lastReadAt);
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg md:text-2xl font-semibold text-gray-800">StemSense</h1>
            <p className="text-xs md:text-sm text-gray-600 hidden sm:block">Soil Moisture & Irrigation Monitoring</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 md:gap-6">
          <div className="text-right hidden md:block">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-600">Connected</span>
            </div>
            <p className="text-xs text-gray-500">
              Last updated: {currentTime.toLocaleTimeString()}
            </p>
          </div>
          
          {/* Notifications Dropdown */}
          <div className="relative" ref={panelRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-all duration-200"
            >
              <Bell className={`w-5 h-5 transition-colors ${notificationsOpen ? 'text-[#2E7D32]' : 'text-gray-600'}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            {notificationsOpen && (
              <div className="absolute top-full right-0 mt-2 w-[360px] md:w-[400px] bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#2E7D32]/5 to-[#1B5E20]/5 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold bg-[#2E7D32] text-white px-1.5 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="p-1.5 hover:bg-[#2E7D32]/10 rounded-lg transition-colors group"
                        title="Mark all as read"
                      >
                        <CheckCheck className="w-4 h-4 text-gray-400 group-hover:text-[#2E7D32] transition-colors" />
                      </button>
                    )}
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
                
                {/* Notification List */}
                <div className="max-h-[380px] overflow-y-auto overscroll-contain">
                  {alerts.length > 0 ? (
                    <div>
                      {alerts.slice(0, 8).map((alert) => {
                        const Icon = getIcon(alert.type, alert.severity);
                        const unread = isUnread(alert.timestamp);
                        return (
                          <div
                            key={alert._id}
                            className={`px-4 py-3 border-b border-gray-50 transition-colors cursor-pointer
                              ${unread ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-gray-50'}`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Unread indicator + Icon */}
                              <div className="relative flex-shrink-0 mt-0.5">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  alert.severity === 'critical' ? 'bg-red-100' :
                                  alert.severity === 'warning' ? 'bg-orange-100' :
                                  alert.type === 'manual' ? 'bg-blue-100' :
                                  'bg-emerald-100'
                                }`}>
                                  <Icon className={`w-3.5 h-3.5 ${
                                    alert.severity === 'critical' ? 'text-red-600' :
                                    alert.severity === 'warning' ? 'text-orange-600' :
                                    alert.type === 'manual' ? 'text-blue-600' :
                                    'text-emerald-600'
                                  }`} />
                                </div>
                                {unread && (
                                  <div className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-white" />
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <p className={`text-[13px] leading-snug break-words ${unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                  {alert.message}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                    alert.type === 'manual' ? 'bg-blue-100 text-blue-700' :
                                    alert.type === 'auto' ? 'bg-purple-100 text-purple-700' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {alert.type === 'manual' ? 'Manual' : alert.type === 'auto' ? 'Auto' : 'System'}
                                  </span>
                                  <span className="text-[11px] text-gray-400">{formatTime(alert.timestamp)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <BellOff className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-400">All caught up!</p>
                      <p className="text-xs text-gray-300 mt-1">No recent notifications</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                {alerts.length > 0 && (
                  <div className="border-t border-gray-100">
                    <button
                      className="w-full py-2.5 text-center text-xs font-semibold text-[#2E7D32] hover:bg-[#2E7D32]/5 transition-colors"
                      onClick={() => { navigate('/alerts'); setNotificationsOpen(false); }}
                    >
                      View all activity →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <User className="w-5 h-5 text-gray-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-2 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{user?.username || 'User'}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role || 'user'}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <div className="px-2 py-2">
                <h4 className="text-xs font-semibold text-gray-600 px-2 py-2 mb-2">Permissions:</h4>
                <div className="flex flex-wrap gap-1 px-2">
                  {user?.permissions && user.permissions.length > 0 ? (
                    user.permissions.map((permission) => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">No permissions</p>
                  )}
                </div>
              </div>
              
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
