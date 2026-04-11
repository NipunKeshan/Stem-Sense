import { useState } from 'react';
import { Power, Droplet } from 'lucide-react';

export default function IrrigationControl() {
  const [pumpStatus, setPumpStatus] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4 md:mb-6">
        <Droplet className="w-4 h-4 md:w-5 md:h-5 text-[#2E7D32]" />
        <h2 className="text-base md:text-lg font-semibold text-gray-800">Irrigation Control</h2>
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
            onClick={() => setPumpStatus(true)}
            disabled={pumpStatus}
            className="w-full py-2.5 md:py-3 px-4 bg-[#2E7D32] text-white font-medium rounded-lg hover:bg-[#1B5E20] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
          >
            <Droplet className="w-4 h-4 md:w-5 md:h-5" />
            Start Watering
          </button>
          
          <button
            onClick={() => setPumpStatus(false)}
            disabled={!pumpStatus}
            className="w-full py-2.5 md:py-3 px-4 bg-[#C62828] text-white font-medium rounded-lg hover:bg-[#B71C1C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
          >
            <Power className="w-4 h-4 md:w-5 md:h-5" />
            Stop Watering
          </button>
        </div>

        <div className="pt-3 md:pt-4 border-t border-gray-200 space-y-2">
          <div className="flex justify-between text-xs md:text-sm">
            <span className="text-gray-600">Last irrigation:</span>
            <span className="font-medium text-gray-800">10:00 AM</span>
          </div>
          <div className="flex justify-between text-xs md:text-sm">
            <span className="text-gray-600">Duration:</span>
            <span className="font-medium text-gray-800">15 minutes</span>
          </div>
          <div className="flex justify-between text-xs md:text-sm">
            <span className="text-gray-600">Next recommended:</span>
            <span className="font-medium text-[#2E7D32]">6:00 PM</span>
          </div>
        </div>
      </div>
    </div>
  );
}