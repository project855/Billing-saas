import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: number;
  icon?: ReactNode;
  className?: string;
}

export function MetricCard({ label, value, trend, icon, className = '' }: MetricCardProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm font-medium text-gray-400">{label}</span>
        {icon && <div className="text-green-500">{icon}</div>}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-bold text-white">{value}</div>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {Math.abs(trend)}% vs last month
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
