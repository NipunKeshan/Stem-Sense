import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: string | number;
    isUp: boolean;
  };
  status?: {
    label: string;
    type: 'success' | 'warning' | 'danger' | 'info';
  };
  color: string;
  loading?: boolean;
}

export default function StatCard({ 
  icon: Icon, 
  title, 
  value, 
  unit, 
  trend, 
  status, 
  color,
  loading = false
}: StatCardProps) {
  const getStatusStyles = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 text-green-700 border-green-200';
      case 'warning': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'danger': return 'bg-red-50 text-red-700 border-red-200';
      case 'info': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 transition-all hover:shadow-md group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${color} shadow-sm group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        
        {trend && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg">
            {trend.isUp ? (
              <TrendingUp className="w-3.5 h-3.5 text-red-500" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-green-500" />
            )}
            <span className={`text-xs font-bold ${trend.isUp ? 'text-red-500' : 'text-green-600'}`}>
              {trend.value}
            </span>
          </div>
        )}

        {status && !trend && (
          <span className={`text-[10px] md:text-xs font-bold px-2 py-1 rounded-md border uppercase tracking-wider ${getStatusStyles(status.type)}`}>
            {status.label}
          </span>
        )}
      </div>

      <div>
        <h3 className="text-gray-500 text-xs md:text-sm font-medium mb-1 uppercase tracking-tight">{title}</h3>
        {loading ? (
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
        ) : (
          <div className="flex items-baseline gap-1">
            <p className="text-2xl md:text-3xl font-extrabold text-gray-900 tabular-nums">
              {value}
            </p>
            {unit && <span className="text-sm md:text-base font-semibold text-gray-400">{unit}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
