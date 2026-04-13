import { Link, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Droplets, 
  ThermometerSun, 
  Wind,
  Sun,
  Activity, 
  Bell, 
  Settings,
  X,
  Users,
  LogOut
} from 'lucide-react';

const menuItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard, permission: 'Overview' },
  { path: '/soil-moisture', label: 'Soil Moisture', icon: Droplets, permission: 'Soil Moisture' },
  { path: '/temperature', label: 'Temperature & Humidity', icon: ThermometerSun, permission: 'Temperature' },
  { path: '/air-quality', label: 'Air Quality', icon: Wind, permission: 'Air Quality' },
  { path: '/light', label: 'Light Monitor', icon: Sun, permission: 'Light Monitor' },
  { path: '/system-health', label: 'System Health', icon: Activity, permission: 'System Health' },
  { path: '/alerts', label: 'Alerts', icon: Bell, permission: 'Alerts' },
  { path: '/settings', label: 'Settings', icon: Settings, permission: 'Settings' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const hasAccess = (permission: string) => user?.role === 'admin' || user?.permissions?.includes(permission);
  const visibleItems = menuItems.filter(item => hasAccess(item.permission));

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-[#1B5E20] text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-green-700 flex items-center justify-between">
          <h1 className="text-xl font-semibold">StemSense</h1>
          <button 
            onClick={onClose}
            className="lg:hidden p-1 hover:bg-green-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              onClick={onClose}
              className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                location.pathname === '/admin' ? 'bg-green-700 border-l-4 border-[#A5D6A7]' : 'hover:bg-green-800'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-sm md:text-base">Admin Panel</span>
            </Link>
          )}
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                  isActive 
                    ? 'bg-green-700 border-l-4 border-[#A5D6A7]' 
                    : 'hover:bg-green-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm md:text-base">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-green-700">
          <button 
            onClick={() => logout()}
            className="flex items-center gap-3 px-2 py-2 w-full text-left transition-colors hover:bg-green-800 rounded"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}