import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import axios from 'axios';

interface PumpEvent {
  pump_state: number;
  timestamp: string; // already formatted by backend as Sri Lanka local time
}

export default function PumpStatusCard() {
  const [events, setEvents] = useState<PumpEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/sensors/pump/today');
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          setEvents(res.data.data);
        } else {
          setEvents([]);
        }
      } catch (err) {
        console.error('Error fetching pump events', err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 md:w-5 md:h-5 text-[#2E7D32]" />
        <h2 className="text-base md:text-lg font-semibold text-gray-800">Pump — Today (ON)</h2>
        <div className="ml-auto text-sm text-gray-500">{loading ? 'Loading…' : `${events.length} event${events.length !== 1 ? 's' : ''}`}</div>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="text-sm text-gray-500">Loading events…</div>
        ) : events.length === 0 ? (
          <div className="text-sm text-gray-500">No pump ON events recorded today.</div>
        ) : (
          <ul className="space-y-2 hide-scrollbar overflow-y-auto px-1 py-1 max-h-full">
            {events.map((ev, idx) => (
              <li key={idx} className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2">
                <div className="text-sm text-gray-700">{ev.timestamp}</div>
                <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                  ON
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-400">Times shown in Sri Lanka local time (Asia/Colombo).</div>
    </div>
  );
}
