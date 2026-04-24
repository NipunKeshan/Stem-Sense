import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Brush, ReferenceArea } from 'recharts';
import { Calendar } from 'lucide-react';
import axios from 'axios';

interface MoistureTrendChartProps {
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

export default function MoistureTrendChart({ timeRange, onTimeRangeChange }: MoistureTrendChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/sensors');
        if (res.data.success && res.data.data) {
          const allData = [...res.data.data].reverse();

          let sliced: any[];
          const now = new Date();
          if (timeRange === '6h') {
            const cutoff = new Date(now.getTime() - 6 * 60 * 60 * 1000);
            sliced = allData.filter((item: any) => new Date(item.timestamp) >= cutoff);
          } else if (timeRange === 'all') {
            sliced = allData;
          } else {
            sliced = allData.slice(-24); // last 24 readings
          }

          const processed = sliced.map((item: any) => {
            const d = new Date(item.timestamp);
            return {
              time: timeRange === '24h'
                ? `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
                : `${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`,
              moisture: item.soil_moisture || 0,
            };
          });
          setChartData(processed);
        }
      } catch (err) {
        console.error('Error fetching moisture trend', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [timeRange]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
        <h2 className="text-base md:text-lg font-semibold text-gray-800">Soil Moisture Trend</h2>
        <div className="flex gap-2 overflow-x-auto items-center">
          <Calendar className="w-4 h-4 text-gray-400" />
          {(['6h', '24h', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                timeRange === range
                  ? 'bg-[#2E7D32] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range === '6h' ? '6 Hours' : range === '24h' ? '24 Hours' : 'All Data'}
            </button>
          ))}
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} />
          <XAxis 
            dataKey="time" 
            stroke="#6B7280"
            style={{ fontSize: '10px' }}
            className="md:text-xs"
          />
          <YAxis 
            stroke="#6B7280"
            style={{ fontSize: '10px' }}
            className="md:text-xs"
            domain={[0, 100]}
            label={{ value: 'Moisture %', angle: -90, position: 'insideLeft', style: { fontSize: '10px' } }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '12px'
            }}
            formatter={(value: number) => [`${value}%`, 'Moisture']}
          />
          <ReferenceArea y1={40} y2={70} fill="#2E7D32" fillOpacity={0.05} 
                label={{ value: 'Optimal', position: 'insideTopLeft', fill: '#2E7D32', fontSize: 9 }} />
          <ReferenceLine 
            y={30} 
            stroke="#E53935" 
            strokeDasharray="5 5" 
            label={{ value: 'Min', position: 'right', fill: '#E53935', fontSize: 10 }}
          />
          <ReferenceLine 
            y={95} 
            stroke="#B71C1C" 
            strokeDasharray="5 5" 
            label={{ value: 'Safety', position: 'right', fill: '#B71C1C', fontSize: 10 }}
          />
          <Line 
            type="monotone" 
            dataKey="moisture" 
            stroke="#2E7D32" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
            name="Moisture %"
          />
          <Brush dataKey="time" height={25} stroke="#2E7D32" travellerWidth={8} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
