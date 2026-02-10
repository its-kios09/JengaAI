// Pipeline node & edge types for the visual pipeline editor

export type PipelineNodeType = 'data-source' | 'preprocessor' | 'model' | 'training' | 'deployment';

export type PipelineNodeStatus = 'unconfigured' | 'configured' | 'running' | 'completed' | 'error';

export type PipelineNodeData = {
  label: string;
  nodeType: PipelineNodeType;
  status: PipelineNodeStatus;
  config: Record<string, unknown>;
};

export type PipelineNode = {
  id: string;
  type: PipelineNodeType;
  position: { x: number; y: number };
  data: PipelineNodeData;
};

export type PipelineEdge = {
  id: string;
  source: string;
  target: string;
};

export type Pipeline = {
  id: string;
  name: string;
  description: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  createdAt: string;
  updatedAt: string;
};

// Teachable Machine types

export type ClassSample = {
  id: string;
  text: string;
  addedAt: string;
};

export type ClassBucket = {
  id: string;
  name: string;
  color: string;
  samples: ClassSample[];
};

export type TrainingProgress = {
  isTraining: boolean;
  isDone: boolean;
  currentEpoch: number;
  totalEpochs: number;
  metrics: { epoch: number; loss: number; accuracy: number }[];
};

export type LivePrediction = {
  classId: string;
  className: string;
  confidence: number;
  color: string;
};
