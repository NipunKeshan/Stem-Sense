import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
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
          if (timeRange === '7d') {
            sliced = allData.slice(-168); // ~7 days of readings at 1/hr
          } else if (timeRange === '30d') {
            sliced = allData; // all available
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
        <div className="flex gap-2 overflow-x-auto">
          {['24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                timeRange === range
                  ? 'bg-[#2E7D32] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
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
            dot={{ fill: '#2E7D32', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
