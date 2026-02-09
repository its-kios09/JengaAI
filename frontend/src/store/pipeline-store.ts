import { create } from 'zustand';
import type {
  PipelineNode,
  PipelineEdge,
  PipelineNodeData,
  ClassBucket,
  ClassSample,
  TrainingProgress,
  LivePrediction,
} from '@/types/pipeline.ts';

type PipelineStore = {
  // Pipeline editor state
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  selectedNodeId: string | null;
  pipelineName: string;

  setNodes: (nodes: PipelineNode[]) => void;
  setEdges: (edges: PipelineEdge[]) => void;
  addNode: (node: PipelineNode) => void;
  updateNodeData: (nodeId: string, data: Partial<PipelineNodeData>) => void;
  removeNode: (nodeId: string) => void;
  addEdge: (edge: PipelineEdge) => void;
  removeEdge: (edgeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  setPipelineName: (name: string) => void;
  loadPipeline: (nodes: PipelineNode[], edges: PipelineEdge[], name: string) => void;

  // Teachable Machine state
  classes: ClassBucket[];
  training: TrainingProgress;
  predictions: LivePrediction[];

  addClass: (name: string) => void;
  removeClass: (classId: string) => void;
  renameClass: (classId: string, name: string) => void;
  addSample: (classId: string, text: string) => void;
  removeSample: (classId: string, sampleId: string) => void;
  setTraining: (training: Partial<TrainingProgress>) => void;
  setPredictions: (predictions: LivePrediction[]) => void;
  resetTeachable: () => void;
};

const CLASS_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

let classCounter = 0;
let sampleCounter = 0;

const initialTraining: TrainingProgress = {
  isTraining: false,
  isDone: false,
  currentEpoch: 0,
  totalEpochs: 10,
  metrics: [],
};

export const usePipelineStore = create<PipelineStore>((set) => ({
  // Pipeline editor
  nodes: [],
  edges: [],
  selectedNodeId: null,
  pipelineName: 'Untitled Pipeline',

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  addNode: (node) => set((s) => ({ nodes: [...s.nodes, node] })),
  updateNodeData: (nodeId, data) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n,
      ),
    })),
  removeNode: (nodeId) =>
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== nodeId),
      edges: s.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: s.selectedNodeId === nodeId ? null : s.selectedNodeId,
    })),
  addEdge: (edge) => set((s) => ({ edges: [...s.edges, edge] })),
  removeEdge: (edgeId) => set((s) => ({ edges: s.edges.filter((e) => e.id !== edgeId) })),
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
  setPipelineName: (name) => set({ pipelineName: name }),
  loadPipeline: (nodes, edges, name) => set({ nodes, edges, pipelineName: name, selectedNodeId: null }),

  // Teachable Machine
  classes: [
    { id: 'cls_1', name: 'Class 1', color: CLASS_COLORS[0], samples: [] },
    { id: 'cls_2', name: 'Class 2', color: CLASS_COLORS[1], samples: [] },
  ],
  training: initialTraining,
  predictions: [],

  addClass: (name) => {
    classCounter++;
    set((s) => ({
      classes: [
        ...s.classes,
        { id: `cls_${Date.now()}_${classCounter}`, name, color: CLASS_COLORS[s.classes.length % CLASS_COLORS.length], samples: [] },
      ],
    }));
  },
  removeClass: (classId) => set((s) => ({ classes: s.classes.filter((c) => c.id !== classId) })),
  renameClass: (classId, name) =>
    set((s) => ({
      classes: s.classes.map((c) => (c.id === classId ? { ...c, name } : c)),
    })),
  addSample: (classId, text) => {
    sampleCounter++;
    const sample: ClassSample = { id: `smp_${Date.now()}_${sampleCounter}`, text, addedAt: new Date().toISOString() };
    set((s) => ({
      classes: s.classes.map((c) =>
        c.id === classId ? { ...c, samples: [...c.samples, sample] } : c,
      ),
    }));
  },
  removeSample: (classId, sampleId) =>
    set((s) => ({
      classes: s.classes.map((c) =>
        c.id === classId ? { ...c, samples: c.samples.filter((smp) => smp.id !== sampleId) } : c,
      ),
    })),
  setTraining: (training) => set((s) => ({ training: { ...s.training, ...training } })),
  setPredictions: (predictions) => set({ predictions }),
  resetTeachable: () =>
    set({
      classes: [
        { id: 'cls_1', name: 'Class 1', color: CLASS_COLORS[0], samples: [] },
        { id: 'cls_2', name: 'Class 2', color: CLASS_COLORS[1], samples: [] },
      ],
      training: initialTraining,
      predictions: [],
    }),
}));
