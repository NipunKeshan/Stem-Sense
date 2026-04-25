import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface SensorDataState {
  latestData: any | null;
  loading: boolean;
  error: string | null;
  refreshLatest: () => Promise<void>;
  pumpStatus: { desired: number; actual: number };
}

const SensorDataContext = createContext<SensorDataState | undefined>(undefined);

export function SensorDataProvider({ children }: { children: React.ReactNode }) {
  const [latestData, setLatestData] = useState<any | null>(null);
  const [pumpStatus, setPumpStatus] = useState({ desired: 0, actual: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLatest = useCallback(async () => {
    try {
      // Parallelize requests to improve speed
      const [latestRes, pumpRes] = await Promise.all([
        axios.get('/api/sensors/latest'),
        axios.get('/api/sensors/pump')
      ]);

      if (latestRes.data.success) {
        const data = latestRes.data.data;
        setLatestData(data);
        setPumpStatus(prev => ({ ...prev, actual: data?.pump_state || 0 }));
        // Persist to localStorage for instant loading next time
        if (data) {
          localStorage.setItem('stemsense_latest_data', JSON.stringify(data));
        }
      }
      
      if (pumpRes.data.success) {
        const desired = pumpRes.data.desired_pump_state;
        setPumpStatus(prev => ({ ...prev, desired }));
        localStorage.setItem('stemsense_pump_status', JSON.stringify({ desired, actual: latestRes.data.data?.pump_state || 0 }));
      }
      
      setError(null);
    } catch (err: any) {
      console.error('SensorDataContext Error:', err);
      // Don't show error if we have cached data, unless it's a critical failure
      if (!latestData) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [latestData]);

  useEffect(() => {
    // Load from localStorage for instant UI
    const cachedData = localStorage.getItem('stemsense_latest_data');
    const cachedPump = localStorage.getItem('stemsense_pump_status');
    
    if (cachedData) {
      setLatestData(JSON.parse(cachedData));
      setLoading(false); // We have something to show
    }
    if (cachedPump) {
      setPumpStatus(JSON.parse(cachedPump));
    }

    fetchLatest();
    const interval = setInterval(fetchLatest, 10000); // 10s polling
    return () => clearInterval(interval);
  }, [fetchLatest]);

  return (
    <SensorDataContext.Provider value={{ 
      latestData, 
      loading, 
      error, 
      refreshLatest: fetchLatest,
      pumpStatus
    }}>
      {children}
    </SensorDataContext.Provider>
  );
}

export function useSensorData() {
  const context = useContext(SensorDataContext);
  if (context === undefined) {
    throw new Error('useSensorData must be used within a SensorDataProvider');
  }
  return context;
}
