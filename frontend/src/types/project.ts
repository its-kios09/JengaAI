export type TaskType = 'classification' | 'ner' | 'sentiment' | 'regression';

export type ProjectStatus = 'draft' | 'training' | 'trained' | 'deployed' | 'failed';

export type Project = {
  id: string;
  name: string;
  description: string;
  taskType: TaskType;
  status: ProjectStatus;
  modelName: string;
  datasetId?: string;
  datasetName?: string;
  accuracy?: number;
  f1Score?: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectCreateRequest = {
  name: string;
  description: string;
  taskType: TaskType;
  modelName: string;
  datasetId?: string;
  config: Record<string, unknown>;
};
