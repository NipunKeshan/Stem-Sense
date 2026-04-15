import { useState } from 'react';
import MoistureStatusCard from '../components/MoistureStatusCard';
import MoistureTrendChart from '../components/MoistureTrendChart';
import IrrigationControl from '../components/IrrigationControl';

export default function SoilMoisture() {
  const [timeRange, setTimeRange] = useState('24h');

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <MoistureStatusCard />
        <div className="lg:col-span-2">
           <IrrigationControl />
          
        </div>
      </div>
        <div >
         <MoistureTrendChart timeRange={timeRange} onTimeRangeChange={setTimeRange} />
        </div>  
    </div>
  );
}