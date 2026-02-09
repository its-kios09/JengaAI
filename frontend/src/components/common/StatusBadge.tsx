import { CheckCircle, XCircle, Clock, Play, AlertCircle, Rocket } from 'lucide-react';
import { Badge } from '@/components/ui/Badge.tsx';
import type { ReactNode } from 'react';

type StatusConfig = {
  variant: 'default' | 'success' | 'warning' | 'danger' | 'info';
  icon: ReactNode;
  label: string;
};

const statusMap: Record<string, StatusConfig> = {
  draft: { variant: 'default', icon: <Clock size={12} />, label: 'Draft' },
  queued: { variant: 'info', icon: <Clock size={12} />, label: 'Queued' },
  training: { variant: 'info', icon: <Play size={12} />, label: 'Training' },
  running: { variant: 'info', icon: <Play size={12} />, label: 'Running' },
  completed: { variant: 'success', icon: <CheckCircle size={12} />, label: 'Completed' },
  trained: { variant: 'success', icon: <CheckCircle size={12} />, label: 'Trained' },
  deployed: { variant: 'success', icon: <Rocket size={12} />, label: 'Deployed' },
  failed: { variant: 'danger', icon: <XCircle size={12} />, label: 'Failed' },
  stopped: { variant: 'warning', icon: <AlertCircle size={12} />, label: 'Stopped' },
  uploading: { variant: 'info', icon: <Play size={12} />, label: 'Uploading' },
  processing: { variant: 'info', icon: <Play size={12} />, label: 'Processing' },
  ready: { variant: 'success', icon: <CheckCircle size={12} />, label: 'Ready' },
  error: { variant: 'danger', icon: <XCircle size={12} />, label: 'Error' },
};

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusMap[status] || { variant: 'default' as const, icon: <Clock size={12} />, label: status };
  return (
    <Badge variant={config.variant} className={className}>
      <span className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </span>
    </Badge>
  );
}
