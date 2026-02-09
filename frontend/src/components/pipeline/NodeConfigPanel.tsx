import { X } from 'lucide-react';
import { usePipelineStore } from '@/store/pipeline-store.ts';
import { Input } from '@/components/ui/Input.tsx';
import { Select } from '@/components/ui/Select.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { mockDatasets } from '@/lib/mock-data.ts';

export function NodeConfigPanel() {
  const selectedNodeId = usePipelineStore((s) => s.selectedNodeId);
  const nodes = usePipelineStore((s) => s.nodes);
  const updateNodeData = usePipelineStore((s) => s.updateNodeData);
  const removeNode = usePipelineStore((s) => s.removeNode);
  const selectNode = usePipelineStore((s) => s.selectNode);

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const updateConfig = (key: string, value: unknown) => {
    updateNodeData(node.id, {
      config: { ...node.data.config, [key]: value },
      status: 'configured',
    });
  };

  return (
    <div className="w-72 border-l border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-700">
        <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">Configure Node</h3>
        <button onClick={() => selectNode(null)} className="p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-400">
          <X size={16} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <Input
          label="Label"
          value={node.data.label}
          onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
        />

        {node.data.nodeType === 'data-source' && (
          <>
            <Select
              label="Dataset"
              value={(node.data.config.datasetId as string) || ''}
              onChange={(e) => {
                const ds = mockDatasets.find((d) => d.id === e.target.value);
                if (ds) {
                  updateConfig('datasetId', ds.id);
                  updateConfig('datasetName', ds.name);
                  updateConfig('format', ds.format);
                  updateConfig('textColumn', ds.textColumn);
                  updateConfig('labelColumn', ds.labelColumn);
                  updateNodeData(node.id, { label: ds.name });
                }
              }}
              options={mockDatasets.map((d) => ({ value: d.id, label: `${d.name} (${d.format})` }))}
              placeholder="Choose dataset..."
            />
          </>
        )}

        {node.data.nodeType === 'preprocessor' && (
          <>
            <Select
              label="Tokenizer"
              value={(node.data.config.tokenizer as string) || ''}
              onChange={(e) => updateConfig('tokenizer', e.target.value)}
              options={[
                { value: 'bert-base-multilingual-cased', label: 'BERT Multilingual' },
                { value: 'xlm-roberta-base', label: 'XLM-RoBERTa' },
                { value: 'distilbert-base-multilingual-cased', label: 'DistilBERT Multilingual' },
              ]}
              placeholder="Select tokenizer..."
            />
            <Input
              label="Max Length"
              type="number"
              value={String(node.data.config.maxLength || 256)}
              onChange={(e) => updateConfig('maxLength', Number(e.target.value))}
            />
            <label className="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300">
              <input
                type="checkbox"
                checked={Boolean(node.data.config.lowercase)}
                onChange={(e) => updateConfig('lowercase', e.target.checked)}
                className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
              />
              Lowercase text
            </label>
          </>
        )}

        {node.data.nodeType === 'model' && (
          <>
            <Select
              label="Model"
              value={(node.data.config.modelName as string) || ''}
              onChange={(e) => updateConfig('modelName', e.target.value)}
              options={[
                { value: 'bert-base-multilingual-cased', label: 'BERT Multilingual' },
                { value: 'xlm-roberta-base', label: 'XLM-RoBERTa' },
                { value: 'distilbert-base-multilingual-cased', label: 'DistilBERT Multilingual' },
                { value: 'bert-base-uncased', label: 'BERT Base' },
              ]}
              placeholder="Select model..."
            />
            <Select
              label="Task Type"
              value={(node.data.config.taskType as string) || ''}
              onChange={(e) => updateConfig('taskType', e.target.value)}
              options={[
                { value: 'classification', label: 'Classification' },
                { value: 'ner', label: 'Named Entity Recognition' },
                { value: 'sentiment', label: 'Sentiment Analysis' },
                { value: 'regression', label: 'Regression' },
              ]}
              placeholder="Select task..."
            />
            <Input
              label="Number of Labels"
              type="number"
              value={String(node.data.config.numLabels || 2)}
              onChange={(e) => updateConfig('numLabels', Number(e.target.value))}
            />
          </>
        )}

        {node.data.nodeType === 'training' && (
          <>
            <Input
              label="Epochs"
              type="number"
              value={String(node.data.config.epochs || 5)}
              onChange={(e) => updateConfig('epochs', Number(e.target.value))}
            />
            <Input
              label="Learning Rate"
              type="number"
              value={String(node.data.config.learningRate || 5e-5)}
              onChange={(e) => updateConfig('learningRate', Number(e.target.value))}
            />
            <Input
              label="Batch Size"
              type="number"
              value={String(node.data.config.batchSize || 32)}
              onChange={(e) => updateConfig('batchSize', Number(e.target.value))}
            />
            <Input
              label="Warmup Steps"
              type="number"
              value={String(node.data.config.warmupSteps || 500)}
              onChange={(e) => updateConfig('warmupSteps', Number(e.target.value))}
            />
          </>
        )}

        {node.data.nodeType === 'deployment' && (
          <>
            <Select
              label="Deploy Target"
              value={(node.data.config.target as string) || ''}
              onChange={(e) => updateConfig('target', e.target.value)}
              options={[
                { value: 'api', label: 'REST API' },
                { value: 'export', label: 'Export (ONNX)' },
                { value: 'download', label: 'Download Model' },
              ]}
              placeholder="Select target..."
            />
          </>
        )}

        <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
          <Button variant="danger" size="sm" className="w-full" onClick={() => removeNode(node.id)}>
            Remove Node
          </Button>
        </div>
      </div>
    </div>
  );
}
