import { Activity } from 'lucide-react';
import { BaseNode } from './BaseNode.tsx';
import type { NodeProps } from '@xyflow/react';
import type { PipelineNodeData } from '@/types/pipeline.ts';

type TrainingNodeProps = NodeProps & { data: PipelineNodeData };

export function TrainingNode({ id, data }: TrainingNodeProps) {
  const epochs = data.config.epochs as number | undefined;
  const lr = data.config.learningRate as number | undefined;
  const batch = data.config.batchSize as number | undefined;

  return (
    <BaseNode
      id={id}
      icon={<Activity size={16} />}
      label={data.label}
      subtitle={epochs ? `${epochs} epochs` : 'Configure training'}
      status={data.status}
    >
      {(lr || batch) && (
        <div className="mt-2 flex gap-2 text-[10px] text-surface-400">
          {lr && <span>LR: {lr}</span>}
          {batch && <span>Batch: {batch}</span>}
        </div>
      )}
    </BaseNode>
  );
}
