import { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
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

  // Load template if id matches
  const template = id ? pipelineTemplates.find((t) => t.id === id) : null;
  const initialNodes = template ? template.nodes : store.nodes;
  const initialEdges = template ? template.edges : store.edges;

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges as Edge[]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges],
  );

  const handleSave = () => {
    store.setNodes(nodes as typeof store.nodes);
    store.setEdges(edges as typeof store.edges);
  };

  const handleRun = () => {
    // Mark all configured nodes as running, then completed after delay
    const configuredIds = nodes.filter((n) => (n.data as { status: string }).status === 'configured').map((n) => n.id);
    setNodes((nds) =>
      nds.map((n) =>
        configuredIds.includes(n.id) ? { ...n, data: { ...n.data, status: 'running' } } : n,
      ),
    );
    setTimeout(() => {
      setNodes((nds) =>
        nds.map((n) =>
          configuredIds.includes(n.id) ? { ...n, data: { ...n.data, status: 'completed' } } : n,
        ),
      );
    }, 3000);
  };

  useMemo(() => nodes.find((n) => n.id === store.selectedNodeId), [nodes, store.selectedNodeId]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={template?.name || store.pipelineName}
            onChange={(e) => store.setPipelineName(e.target.value)}
            className="text-lg font-semibold bg-transparent border-none outline-none text-surface-900 dark:text-surface-100 w-72"
          />
          <span className="text-xs text-surface-400 dark:text-surface-500">{nodes.length} nodes</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<Save size={14} />} onClick={handleSave}>
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
            nodes={nodes}
            edges={edges}
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
