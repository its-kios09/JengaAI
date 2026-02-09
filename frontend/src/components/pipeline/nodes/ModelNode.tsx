import { Brain } from 'lucide-react';
import { BaseNode } from './BaseNode.tsx';
import type { NodeProps } from '@xyflow/react';
import type { PipelineNodeData } from '@/types/pipeline.ts';

type ModelNodeProps = NodeProps & { data: PipelineNodeData };

export function ModelNode({ id, data }: ModelNodeProps) {
  const modelName = data.config.modelName as string | undefined;
  const taskType = data.config.taskType as string | undefined;
  return (
    <BaseNode
      id={id}
      icon={<Brain size={16} />}
      label={data.label}
      subtitle={modelName || 'Select model'}
      status={data.status}
    >
      {taskType && (
        <div className="mt-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 capitalize font-medium">
            {taskType}
          </span>
        </div>
      )}
    </BaseNode>
  );
}
