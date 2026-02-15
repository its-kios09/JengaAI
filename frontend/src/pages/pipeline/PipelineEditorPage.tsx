import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
} from '@xyflow/react';
import type { Connection, NodeChange, EdgeChange, Node } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { usePipelineStore } from '@/store/pipeline-store.ts';
import { NodePalette } from '@/components/pipeline/NodePalette.tsx';
import { NodeConfigPanel } from '@/components/pipeline/NodeConfigPanel.tsx';
import {
  DataSourceNode,
  PreprocessorNode,
  ModelNode,
  TrainingNode,
  DeploymentNode,
} from '@/components/pipeline/nodes/index.ts';
import { pipelineTemplates } from '@/lib/mock-pipeline-data.ts';
import type { PipelineNode, PipelineEdge } from '@/types/pipeline.ts';

const nodeTypes = {
  'data-source': DataSourceNode,
  preprocessor: PreprocessorNode,
  model: ModelNode,
  training: TrainingNode,
  deployment: DeploymentNode,
};

export function PipelineEditorPage() {
  const { id } = useParams();
  const store = usePipelineStore();

  // Load template on first render
  const template = id ? pipelineTemplates.find((t) => t.id === id) : null;
  if (template && store.nodes.length === 0) {
    store.loadPipeline(template.nodes, template.edges, template.name);
  }

  const nodes = store.nodes;
  const edges = store.edges;

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updated = applyNodeChanges(changes, nodes as Node[]);
      store.setNodes(updated as PipelineNode[]);
    },
    [nodes, store],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updated = applyEdgeChanges(changes, edges as any[]);
      store.setEdges(updated as PipelineEdge[]);
    },
    [edges, store],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const updated = addEdge(params, edges as any[]);
      store.setEdges(updated as PipelineEdge[]);
    },
    [edges, store],
  );

  const handleRun = () => {
    const configuredIds = nodes
      .filter((n) => n.data.status === 'configured')
      .map((n) => n.id);

    configuredIds.forEach((nid) => {
      store.updateNodeData(nid, { status: 'running' });
    });

    setTimeout(() => {
      configuredIds.forEach((nid) => {
        store.updateNodeData(nid, { status: 'completed' });
      });
    }, 3000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={store.pipelineName}
            onChange={(e) => store.setPipelineName(e.target.value)}
            className="text-lg font-semibold bg-transparent border-none outline-none text-surface-900 dark:text-surface-100 w-72"
          />
          <span className="text-xs text-surface-400 dark:text-surface-500">{nodes.length} nodes</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<Save size={14} />}>
            Save
          </Button>
          <Button size="sm" icon={<Play size={14} />} onClick={handleRun}>
            Run Pipeline
          </Button>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex flex-1 overflow-hidden">
        <NodePalette />

        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes as Node[]}
            edges={edges as any[]}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={(_e, node) => store.selectNode(node.id)}
            onPaneClick={() => store.selectNode(null)}
            fitView
            className="bg-surface-50 dark:bg-surface-900"
          >
            <Background gap={20} size={1} className="!bg-surface-50 dark:!bg-surface-900" />
            <Controls className="!bg-white dark:!bg-surface-800 !border-surface-200 dark:!border-surface-700 !shadow-lg [&>button]:!bg-white dark:[&>button]:!bg-surface-800 [&>button]:!border-surface-200 dark:[&>button]:!border-surface-700" />
            <MiniMap
              className="!bg-white dark:!bg-surface-800 !border-surface-200 dark:!border-surface-700"
              nodeColor={() => '#3b82f6'}
            />
          </ReactFlow>
        </div>

        {store.selectedNodeId && <NodeConfigPanel />}
      </div>
    </div>
  );
}
