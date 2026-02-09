import { ArrowUp, ArrowDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  isRegression?: boolean;
}

export function MetricCard({ title, value, change, isPositive, isRegression }: MetricCardProps) {
  const trendColor = isPositive ? 'text-[#10B981]' : 'text-[#EF4444]';
  const bgColor = isPositive ? 'bg-[#10B981]/10' : 'bg-[#EF4444]/10';
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-6 py-4 shadow-sm">
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className="flex items-baseline gap-3">
        <div className="text-3xl font-semibold text-gray-900">{value}</div>
        <div className={`flex items-center gap-1 ${trendColor} text-sm font-medium`}>
          {isPositive ? (
            <ArrowUp className="w-4 h-4" />
          ) : (
            <ArrowDown className="w-4 h-4" />
          )}
          <span>{change}</span>
          {isRegression && <span className="text-xs">(regression)</span>}
        </div>
      </div>
    </div>
  );
}
