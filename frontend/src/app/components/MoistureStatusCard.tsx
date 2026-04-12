import { useState, useEffect } from 'react';
import { Droplets } from 'lucide-react';
import axios from 'axios';

export default function MoistureStatusCard() {
  const [moistureLevel, setMoistureLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/sensors/latest');
        if (res.data.success && res.data.data) {
          setMoistureLevel(res.data.data.soil_moisture || 0);
          const d = new Date(res.data.data.timestamp);
          const now = new Date();
          const diffMs = now.getTime() - d.getTime();
          const diffMin = Math.floor(diffMs / 60000);
          setLastUpdated(diffMin <= 0 ? 'just now' : `${diffMin} min ago`);
        }
      } catch (err) {
        console.error('Error fetching moisture data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);
  
  const getStatus = (level: number) => {
    if (level < 30) return { label: 'Dry', color: '#E53935' };
    if (level < 40) return { label: 'Moderate', color: '#FDD835' };
    if (level <= 70) return { label: 'Optimal', color: '#43A047' };
    if (level < 95) return { label: 'Wet', color: '#1E88E5' };
    return { label: 'Saturated ⚠', color: '#B71C1C' };
  };

  const status = getStatus(moistureLevel);
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (moistureLevel / 100) * circumference;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Droplets className="w-4 h-4 md:w-5 md:h-5 text-[#2E7D32]" />
        <h2 className="text-base md:text-lg font-semibold text-gray-800">Soil Moisture Status</h2>
      </div>
      
      <div className="flex flex-col items-center py-4 md:py-6">
        <div className="relative w-32 h-32 md:w-48 md:h-48">
          <svg className="transform -rotate-90 w-32 h-32 md:w-48 md:h-48">
            <circle
              cx="64"
              cy="64"
              r="50"
              stroke="#E5E7EB"
              strokeWidth="10"
              fill="none"
              className="md:hidden"
            />
            <circle
              cx="64"
              cy="64"
              r="50"
              stroke={status.color}
              strokeWidth="10"
              fill="none"
              strokeDasharray={2 * Math.PI * 50}
              strokeDashoffset={(2 * Math.PI * 50) - (moistureLevel / 100) * (2 * Math.PI * 50)}
              strokeLinecap="round"
              className="transition-all duration-500 md:hidden"
            />
            <circle
              cx="96"
              cy="96"
              r="70"
              stroke="#E5E7EB"
              strokeWidth="12"
              fill="none"
              className="hidden md:block"
            />
            <circle
              cx="96"
              cy="96"
              r="70"
              stroke={status.color}
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-500 hidden md:block"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl md:text-4xl font-bold text-gray-800">
              {loading ? '...' : `${moistureLevel}%`}
            </div>
            <div className="text-xs md:text-sm text-gray-500">Moisture</div>
          </div>
        </div>
        
        <div className="mt-4 md:mt-6 text-center">
          <div 
            className="inline-block px-3 md:px-4 py-1.5 md:py-2 rounded-full text-white font-medium text-sm md:text-base"
            style={{ backgroundColor: status.color }}
          >
            {status.label}
          </div>
          <p className="text-xs text-gray-500 mt-2">Updated {lastUpdated || '...'}</p>
        </div>
      </div>
    </div>
  );
}