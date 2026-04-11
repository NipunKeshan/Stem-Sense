import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface MoistureTrendChartProps {
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

const data24h = [
  { time: '00:00', moisture: 42 },
  { time: '02:00', moisture: 40 },
  { time: '04:00', moisture: 38 },
  { time: '06:00', moisture: 36 },
  { time: '08:00', moisture: 35 },
  { time: '10:00', moisture: 52 },
  { time: '12:00', moisture: 50 },
  { time: '14:00', moisture: 48 },
  { time: '16:00', moisture: 46 },
  { time: '18:00', moisture: 45 },
  { time: '20:00', moisture: 44 },
  { time: '22:00', moisture: 43 },
];

const data7d = [
  { time: 'Mon', moisture: 38 },
  { time: 'Tue', moisture: 45 },
  { time: 'Wed', moisture: 52 },
  { time: 'Thu', moisture: 48 },
  { time: 'Fri', moisture: 42 },
  { time: 'Sat', moisture: 55 },
  { time: 'Sun', moisture: 45 },
];

const data30d = [
  { time: 'Week 1', moisture: 42 },
  { time: 'Week 2', moisture: 48 },
  { time: 'Week 3', moisture: 52 },
  { time: 'Week 4', moisture: 45 },
];

export default function MoistureTrendChart({ timeRange, onTimeRangeChange }: MoistureTrendChartProps) {
  const getData = () => {
    switch (timeRange) {
      case '7d': return data7d;
      case '30d': return data30d;
      default: return data24h;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
        <h2 className="text-base md:text-lg font-semibold text-gray-800">Soil Moisture Trend</h2>
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => onTimeRangeChange('24h')}
            className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
              timeRange === '24h'
                ? 'bg-[#2E7D32] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            24 Hours
          </button>
          <button
            onClick={() => onTimeRangeChange('7d')}
            className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
              timeRange === '7d'
                ? 'bg-[#2E7D32] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => onTimeRangeChange('30d')}
            className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
              timeRange === '30d'
                ? 'bg-[#2E7D32] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
        <LineChart data={getData()}>
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