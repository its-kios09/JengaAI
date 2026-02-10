import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/Card.tsx';

type MetricCardProps = {
  label: string;
  value: string | number;
  trend?: number;
  icon?: ReactNode;
};

export function MetricCard({ label, value, trend, icon }: MetricCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-surface-500 dark:text-surface-400">{label}</p>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-50 mt-1">{value}</p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
              {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(trend)}% from last month
            </div>
          )}
        </div>
        {icon && <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">{icon}</div>}
      </div>
    </Card>
  );
}
