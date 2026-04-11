import { Radar, Activity, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const motionData = [
  { hour: '00:00', events: 2 },
  { hour: '03:00', events: 1 },
  { hour: '06:00', events: 5 },
  { hour: '09:00', events: 8 },
  { hour: '12:00', events: 12 },
  { hour: '15:00', events: 15 },
  { hour: '18:00', events: 10 },
  { hour: '21:00', events: 6 },
];

const recentEvents = [
  { id: 1, time: '14:23:15', location: 'Zone A', intensity: 'High' },
  { id: 2, time: '13:45:32', location: 'Zone B', intensity: 'Medium' },
  { id: 3, time: '12:18:44', location: 'Zone A', intensity: 'Low' },
  { id: 4, time: '11:02:19', location: 'Zone C', intensity: 'High' },
  { id: 5, time: '09:47:55', location: 'Zone B', intensity: 'Medium' },
];

export default function MotionDetection() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <Radar className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
            <h2 className="text-base md:text-lg font-semibold text-gray-800">Motion Status</h2>
          </div>
          <div className="text-center py-3 md:py-4">
            <div className="w-16 h-16 md:w-24 md:h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <Activity className="w-8 h-8 md:w-12 md:h-12 text-green-600" />
            </div>
            <p className="mt-3 md:mt-4 text-lg md:text-xl font-semibold text-gray-800">Active</p>
            <p className="text-xs md:text-sm text-gray-600">Monitoring all zones</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="text-xs md:text-sm font-medium text-gray-600 mb-2">Events Today</h3>
          <p className="text-3xl md:text-4xl font-bold text-purple-600">12</p>
          <p className="text-xs md:text-sm text-green-600 mt-2">↑ 4 from yesterday</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="text-xs md:text-sm font-medium text-gray-600 mb-2">Last Detection</h3>
          <p className="text-xl md:text-2xl font-bold text-gray-800">14:23:15</p>
          <p className="text-xs md:text-sm text-gray-600 mt-2">Zone A - High intensity</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-4 md:mb-6">Motion Events - Last 24 Hours</h2>
        <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
          <BarChart data={motionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="hour" stroke="#6B7280" style={{ fontSize: '10px' }} className="md:text-xs" />
            <YAxis 
              stroke="#6B7280" 
              style={{ fontSize: '10px' }}
              className="md:text-xs"
              label={{ value: 'Events', angle: -90, position: 'insideLeft', style: { fontSize: '10px' } }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '11px'
              }}
              formatter={(value: number) => [`${value} events`, 'Motion']}
            />
            <Bar dataKey="events" fill="#9333EA" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">Recent Motion Events</h2>
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full min-w-[500px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-600">Time</th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-600">Location</th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-600">Intensity</th>
                <th className="px-3 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-800">{event.time}</td>
                  <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-800">{event.location}</td>
                  <td className="px-3 md:px-4 py-2 md:py-3">
                    <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium ${
                      event.intensity === 'High' ? 'bg-red-100 text-red-700' :
                      event.intensity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {event.intensity}
                    </span>
                  </td>
                  <td className="px-3 md:px-4 py-2 md:py-3">
                    <AlertCircle className="w-3 h-3 md:w-4 md:h-4 text-purple-500" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}