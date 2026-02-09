import { Database } from 'lucide-react';
import { BaseNode } from './BaseNode.tsx';
import type { NodeProps } from '@xyflow/react';
import type { PipelineNodeData } from '@/types/pipeline.ts';

type DataSourceNodeProps = NodeProps & { data: PipelineNodeData };

export function DataSourceNode({ id, data }: DataSourceNodeProps) {
  const datasetName = data.config.datasetName as string | undefined;
  return (
    <BaseNode
      id={id}
      icon={<Database size={16} />}
      label={data.label}
      subtitle={datasetName || 'No dataset selected'}
      status={data.status}
      showTargetHandle={false}
    >
      {typeof data.config.format === 'string' && (
        <div className="mt-2 flex gap-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-700 text-surface-500 uppercase font-medium">
            {data.config.format}
          </span>
        </div>
      )}
    </BaseNode>
  );
}
