import { useState, useEffect } from 'react';
import { Power, Droplet, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const SOIL_SAFETY_THRESHOLD = 95;

export default function IrrigationControl() {
  const [pumpStatus, setPumpStatus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [soilMoisture, setSoilMoisture] = useState(0);
  const [isHardwareLocked, setIsHardwareLocked] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // Fetch sensor data for moisture
        const resData = await axios.get('http://localhost:5000/api/sensors/latest');
        if (resData.data.success && resData.data.data) {
          setSoilMoisture(resData.data.data.soil_moisture || 0);
          const d = new Date(resData.data.data.timestamp);
          setLastUpdate(d.toLocaleTimeString());
        }

        // Fetch pump status and lock status
        const resPump = await axios.get('http://localhost:5000/api/sensors/pump');
        if (resPump.data.success) {
          // Use desired_pump_state for the UI to prevent jitter
          setPumpStatus(resPump.data.desired_pump_state === 1);
          setIsHardwareLocked(resPump.data.manual_override === 1);
        }
      } catch (err) {
        console.error('Error fetching pump status', err);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePumpToggle = async (on: boolean) => {
    try {
      setLoading(true);
      await axios.post('http://localhost:5000/api/sensors/pump', {
        pump: on ? 1 : 0
      });
      setPumpStatus(on);
    } catch (err) {
      console.error('Error toggling pump', err);
    } finally {
      setLoading(false);
    }
  };

  const isSaturated = soilMoisture >= SOIL_SAFETY_THRESHOLD;
  const isBlocked = isSaturated || isHardwareLocked;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <Droplet className="w-4 h-4 md:w-5 md:h-5 text-[#2E7D32]" />
          <h2 className="text-base md:text-lg font-semibold text-gray-800">Irrigation Control</h2>
        </div>
        {isHardwareLocked && (
          <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded uppercase tracking-wider animate-pulse">
            <Power className="w-3 h-3" /> Hardware Lock
          </span>
        )}
      </div>
      
      {/* Blocked Status Banners */}
      <div className="space-y-2 mb-4">
        {isHardwareLocked && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
            <Power className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase">Hardware Override Active</p>
              <p className="text-xs text-amber-600">Physical switch on NodeMCU is ON. Remote control is disabled.</p>
            </div>
          </div>
        )}

        {isSaturated && !isHardwareLocked && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-red-800">Safety Override</p>
              <p className="text-xs text-red-600">Soil: {soilMoisture}% — pump blocked (threshold: {SOIL_SAFETY_THRESHOLD}%)</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 md:gap-3">
            <Power className={`w-5 h-5 md:w-6 md:h-6 ${pumpStatus ? 'text-green-600' : 'text-gray-400'}`} />
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-700">Pump Status</p>
              <p className={`text-base md:text-lg font-semibold ${pumpStatus ? 'text-green-600' : 'text-gray-500'}`}>
                {pumpStatus ? 'ON' : 'OFF'}
              </p>
            </div>
          </div>
          <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center ${
            pumpStatus ? 'bg-green-100' : 'bg-gray-200'
          }`}>
            <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full ${
              pumpStatus ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`}></div>
          </div>
        </div>

        <div className="space-y-2 md:space-y-3">
          <button
            onClick={() => handlePumpToggle(true)}
            disabled={pumpStatus || loading || isBlocked}
            className="w-full py-2.5 md:py-3 px-4 bg-[#2E7D32] text-white font-medium rounded-lg hover:bg-[#1B5E20] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
          >
            <Droplet className="w-4 h-4 md:w-5 md:h-5" />
            {isHardwareLocked ? '⚠ Hardware Lock Active' : isSaturated ? '⚠ Soil Saturated' : 'Start Watering'}
          </button>
          
          <button
            onClick={() => handlePumpToggle(false)}
            disabled={!pumpStatus || loading || isHardwareLocked}
            className="w-full py-2.5 md:py-3 px-4 bg-[#C62828] text-white font-medium rounded-lg hover:bg-[#B71C1C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
          >
            <Power className="w-4 h-4 md:w-5 md:h-5" />
            Stop Watering
          </button>
        </div>

        <div className="pt-3 md:pt-4 border-t border-gray-200 space-y-2">
          <div className="flex justify-between text-xs md:text-sm">
            <span className="text-gray-600">Current soil moisture:</span>
            <span className="font-medium text-gray-800">{soilMoisture}%</span>
          </div>
          <div className="flex justify-between text-xs md:text-sm">
            <span className="text-gray-600">Safety threshold:</span>
            <span className="font-medium text-red-600">{SOIL_SAFETY_THRESHOLD}%</span>
          </div>
          <div className="flex justify-between text-xs md:text-sm">
            <span className="text-gray-600">Last reading:</span>
            <span className="font-medium text-gray-800">{lastUpdate || '...'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}