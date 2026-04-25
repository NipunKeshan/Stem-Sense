import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import axios from 'axios';

interface PumpEvent {
  start: string; // ISO timestamp
  end?: string; // ISO timestamp
  duration_min: number;
  sample_count: number;
}

export default function PumpStatusCard() {
  const [events, setEvents] = useState<PumpEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/sensors/pump/today');
        if (res.data && res.data.success && Array.isArray(res.data.runs)) {
          setEvents(res.data.runs);
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
        <h2 className="text-base md:text-lg font-semibold text-gray-800">Today Pump</h2>
        <div className="ml-auto text-sm text-gray-500">{loading ? 'Loading…' : `${events.length} event${events.length !== 1 ? 's' : ''}`}</div>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="text-sm text-gray-500">Loading events…</div>
        ) : events.length === 0 ? (
          <div className="text-sm text-gray-500">No pump ON events recorded today.</div>
        ) : (
          <ul className="space-y-2 hide-scrollbar overflow-y-auto px-1 py-1 h-80">
            {events.map((ev, idx) => {
              const startLocal = new Date(ev.start).toLocaleString('en-GB', { timeZone: 'Asia/Colombo' });
              const endLocal = ev.end ? new Date(ev.end).toLocaleString('en-GB', { timeZone: 'Asia/Colombo' }) : null;
              const durationLabel = ev.duration_min && ev.duration_min > 0
                ? `${ev.duration_min.toFixed(2)} min`
                : ev.sample_count === 1 ? 'instant' : '0 min';

              return (
                <li key={idx} className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2">
                  <div className="text-sm text-gray-700">
                    <div>{startLocal}</div>
                    {endLocal && <div className="text-xs text-gray-500">to {endLocal}</div>}
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium">ON</div>
                    <div className="text-xs text-gray-500 mt-1">{durationLabel}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div></div>
  );
}
