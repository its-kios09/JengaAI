import { Handle, Position } from '@xyflow/react';
import type { ReactNode } from 'react';
import type { PipelineNodeStatus } from '@/types/pipeline.ts';
import { usePipelineStore } from '@/store/pipeline-store.ts';

type BaseNodeProps = {
  id: string;
  icon: ReactNode;
  label: string;
  subtitle?: string;
  status: PipelineNodeStatus;
  showSourceHandle?: boolean;
  showTargetHandle?: boolean;
  children?: ReactNode;
};

const statusStyles: Record<PipelineNodeStatus, { dot: string; border: string }> = {
  unconfigured: { dot: 'bg-surface-400', border: 'border-surface-300 dark:border-surface-600' },
  configured: { dot: 'bg-success-500', border: 'border-success-400 dark:border-success-600' },
  running: { dot: 'bg-primary-500 animate-pulse', border: 'border-primary-400 dark:border-primary-500' },
  completed: { dot: 'bg-success-500', border: 'border-success-500' },
  error: { dot: 'bg-danger-500', border: 'border-danger-400 dark:border-danger-500' },
};

export function BaseNode({ id, icon, label, subtitle, status, showSourceHandle = true, showTargetHandle = true, children }: BaseNodeProps) {
  const selectNode = usePipelineStore((s) => s.selectNode);
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const isSelected = selectedNodeId === id;
  const styles = statusStyles[status];

  return (
    <div
      onClick={() => selectNode(id)}
      className={`relative bg-white dark:bg-surface-800 rounded-xl border-2 shadow-lg min-w-[180px] cursor-pointer transition-all
        ${styles.border} ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-surface-900' : 'hover:shadow-xl'}`}
    >
      {showTargetHandle && (
        <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-primary-500 !border-2 !border-white dark:!border-surface-800" />
      )}

      <div className="px-4 py-3">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="p-1.5 rounded-lg bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">{label}</span>
              <span className={`w-2 h-2 rounded-full shrink-0 ${styles.dot}`} />
            </div>
            {subtitle && <p className="text-xs text-surface-500 dark:text-surface-400 truncate">{subtitle}</p>}
          </div>
        </div>
        {children}
      </div>

      {showSourceHandle && (
        <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-primary-500 !border-2 !border-white dark:!border-surface-800" />
      )}
    </div>
  );
}
