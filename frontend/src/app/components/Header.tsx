import { Bell, User, Menu, LogOut, Settings, AlertTriangle, Droplet, Info, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';

interface Notification {
  id: number;
  severity: 'critical' | 'warning' | 'info' | 'normal';
  message: string;
  time: string;
  icon: any;
  category?: string;
}

interface HeaderProps {
  onMenuClick: () => void;
}

const notifications: Notification[] = [
  {
    id: 1,
    severity: 'warning',
    message: 'Soil moisture dropped below 30%. Irrigation recommended.',
    time: '2 hours ago',
    icon: AlertTriangle,
    category: 'Soil Moisture',
  },
  {
    id: 2,
    severity: 'info',
    message: 'Irrigation cycle completed successfully.',
    time: '4 hours ago',
    icon: Droplet,
    category: 'Irrigation',
  },
  {
    id: 3,
    severity: 'normal',
    message: 'Soil moisture levels optimal for plant growth.',
    time: '6 hours ago',
    icon: Info,
    category: 'System',
  },
];

export default function Header({ onMenuClick }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(notifications.length);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            
            {notificationsOpen && (
              <div className="absolute top-full right-0 mt-2 w-96 max-h-96 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-4 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                
                {notifications.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 p-2 rounded-lg ${
                            notif.severity === 'critical' ? 'bg-red-100' :
                            notif.severity === 'warning' ? 'bg-orange-100' :
                            notif.severity === 'info' ? 'bg-blue-100' :
                            'bg-green-100'
                          }`}>
                            {notif.icon && <notif.icon className={`w-4 h-4 ${
                              notif.severity === 'critical' ? 'text-red-600' :
                              notif.severity === 'warning' ? 'text-orange-600' :
                              notif.severity === 'info' ? 'text-blue-600' :
                              'text-green-600'
                            }`} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-gray-800 truncate">{notif.message}</p>
                              <Badge variant={
                                notif.severity === 'critical' ? 'destructive' :
                                notif.severity === 'warning' ? 'secondary' :
                                'default'
                              }>
                                {notif.severity}
                              </Badge>
                            </div>
                            {notif.category && (
                              <p className="text-xs text-gray-500 mb-1">Category: {notif.category}</p>
                            )}
                            <p className="text-xs text-gray-500">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <p className="text-sm">No notifications</p>
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
              <DropdownMenuItem className="cursor-pointer">
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