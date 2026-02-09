export type TrainingStatus = 'queued' | 'running' | 'completed' | 'failed' | 'stopped';

export type TrainingJob = {
  id: string;
  projectId: string;
  projectName: string;
  status: TrainingStatus;
  progress: number;
  currentEpoch: number;
  totalEpochs: number;
  startedAt: string;
  completedAt?: string;
  estimatedTimeRemaining?: string;
  metrics: TrainingMetrics;
};

export type TrainingMetrics = {
  trainLoss: number[];
  valLoss: number[];
  accuracy: number[];
  f1Score: number[];
  learningRate: number[];
  epochTimestamps: string[];
};

export type TrainingLogEntry = {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
};

export type TrainingConfigSummary = {
  modelName: string;
  taskType: string;
  learningRate: number;
  batchSize: number;
  epochs: number;
  maxSeqLength: number;
  warmupSteps: number;
  weightDecay: number;
};
