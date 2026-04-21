import { useState, useEffect } from 'react';
import MoistureStatusCard from '../components/MoistureStatusCard';
import MoistureTrendChart from '../components/MoistureTrendChart';
import PumpStatusCard from '../components/pumpStatusCard';
import StatCard from '../components/StatCard';
import { Droplets, TrendingUp } from 'lucide-react';
import axios from 'axios';

export default function SoilMoisture() {
  const [timeRange, setTimeRange] = useState('24h');
  const [maxMoisture, setMaxMoisture] = useState<number | null>(null);
  const [minMoisture, setMinMoisture] = useState<number | null>(null);
  const [avgMoisture, setAvgMoisture] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/sensors');
        if (!res.data?.success || !Array.isArray(res.data.data)) return;
        const arr = [...res.data.data];
        arr.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const windowSize = timeRange === '7d' ? 168 : timeRange === '30d' ? arr.length || 0 : 24;
        const slice = windowSize > 0 ? arr.slice(-windowSize) : arr;

        const values = slice
          .map((it: any) => Number(it.soil_moisture ?? NaN))
          .filter((v) => !Number.isNaN(v));

        const max = values.length ? Math.max(...values) : null;
        const min = values.length ? Math.min(...values) : null;
        const avg = values.length ? Number((values.reduce((s, v) => s + v, 0) / values.length).toFixed(1)) : null;

        if (!mounted) return;
        setMaxMoisture(max);
        setMinMoisture(min);
        setAvgMoisture(avg);
      } catch (err) {
        console.error('Error fetching sensor stats', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [timeRange]);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 items-stretch">
        <div className="lg:col-span-2">
          <MoistureStatusCard />
        </div>
        <div className="hidden lg:block">
          <PumpStatusCard />
        </div>
      </div>

      <div>
        <MoistureTrendChart timeRange={timeRange} onTimeRangeChange={setTimeRange} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-4">
        <StatCard
          icon={Droplets}
          title="Max Soil Moisture"
          value={maxMoisture ?? '--'}
          unit="%"
          color="bg-blue-100"
        />

        <StatCard
          icon={Droplets}
          title="Min Soil Moisture"
          value={minMoisture ?? '--'}
          unit="%"
          color="bg-blue-100"
        />

        <StatCard
          icon={TrendingUp}
          title="Avg Soil Moisture"
          value={avgMoisture ?? '--'}
          unit="%"
          color="bg-blue-200"
        />
      </div>
    </div>
  );
}