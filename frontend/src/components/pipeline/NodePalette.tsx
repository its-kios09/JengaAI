import { Database, Filter, Brain, Activity, Rocket } from 'lucide-react';
import type { PipelineNodeType, PipelineNodeData } from '@/types/pipeline.ts';
import { usePipelineStore } from '@/store/pipeline-store.ts';

type PaletteItem = {
  type: PipelineNodeType;
  label: string;
  description: string;
  icon: typeof Database;
  defaultData: PipelineNodeData;
};

const paletteItems: PaletteItem[] = [
  {
    type: 'data-source',
    label: 'Data Source',
    description: 'Upload or connect a dataset',
    icon: Database,
    defaultData: { label: 'Data Source', nodeType: 'data-source', status: 'unconfigured', config: {} },
  },
  {
    type: 'preprocessor',
    label: 'Preprocessor',
    description: 'Clean and tokenize text',
    icon: Filter,
    defaultData: { label: 'Preprocessor', nodeType: 'preprocessor', status: 'unconfigured', config: {} },
  },
  {
    type: 'model',
    label: 'Model',
    description: 'Choose architecture',
    icon: Brain,
    defaultData: { label: 'Model', nodeType: 'model', status: 'unconfigured', config: {} },
  },
  {
    type: 'training',
    label: 'Training',
    description: 'Set hyperparameters',
    icon: Activity,
    defaultData: { label: 'Training', nodeType: 'training', status: 'unconfigured', config: {} },
  },
  {
    type: 'deployment',
    label: 'Deployment',
    description: 'Deploy or export model',
    icon: Rocket,
    defaultData: { label: 'Deployment', nodeType: 'deployment', status: 'unconfigured', config: {} },
  },
];

let nodeIdCounter = 100;

export function NodePalette() {
  const addNode = usePipelineStore((s) => s.addNode);
  const nodes = usePipelineStore((s) => s.nodes);

  const handleAddNode = (item: PaletteItem) => {
    nodeIdCounter++;
    addNode({
      id: `node_${nodeIdCounter}`,
      type: item.type,
      position: { x: 250 + (nodes.length % 3) * 280, y: 150 + Math.floor(nodes.length / 3) * 180 },
      data: { ...item.defaultData },
    });
  };

  return (
    <div className="w-56 border-r border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-3 space-y-2 overflow-y-auto">
      <h3 className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider px-1 mb-3">
        Add Nodes
      </h3>
      {paletteItems.map((item) => (
        <button
          key={item.type}
          onClick={() => handleAddNode(item)}
          className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors
            hover:bg-surface-100 dark:hover:bg-surface-700 group"
        >
          <div className="p-2 rounded-lg bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-400
            group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            <item.icon size={16} />
          </div>
          <div>
            <p className="text-sm font-medium text-surface-800 dark:text-surface-200">{item.label}</p>
            <p className="text-[11px] text-surface-400 dark:text-surface-500">{item.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
