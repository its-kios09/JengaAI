import { Rocket } from 'lucide-react';
import { BaseNode } from './BaseNode.tsx';
import type { NodeProps } from '@xyflow/react';
import type { PipelineNodeData } from '@/types/pipeline.ts';

type DeploymentNodeProps = NodeProps & { data: PipelineNodeData };

export function DeploymentNode({ id, data }: DeploymentNodeProps) {
  const target = data.config.target as string | undefined;
  return (
    <BaseNode
      id={id}
      icon={<Rocket size={16} />}
      label={data.label}
      subtitle={target === 'api' ? 'REST API' : target === 'export' ? 'Export Model' : 'Configure deployment'}
      status={data.status}
      showSourceHandle={false}
    >
      {target && (
        <div className="mt-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 capitalize font-medium">
            {target}
          </span>
        </div>
      )}
    </BaseNode>
  );
}
