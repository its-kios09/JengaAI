import { Filter } from 'lucide-react';
import { BaseNode } from './BaseNode.tsx';
import type { NodeProps } from '@xyflow/react';
import type { PipelineNodeData } from '@/types/pipeline.ts';

type PreprocessorNodeProps = NodeProps & { data: PipelineNodeData };

export function PreprocessorNode({ id, data }: PreprocessorNodeProps) {
  const maxLen = data.config.maxLength as number | undefined;
  return (
    <BaseNode
      id={id}
      icon={<Filter size={16} />}
      label={data.label}
      subtitle={data.config.tokenizer ? String(data.config.tokenizer) : 'Configure tokenizer'}
      status={data.status}
    >
      {maxLen && (
        <p className="text-[10px] text-surface-400 mt-1">Max length: {maxLen}</p>
      )}
    </BaseNode>
  );
}
