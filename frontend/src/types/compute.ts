export type ComputeProviderType = 'platform' | 'runpod' | 'colab' | 'kaggle' | 'local';

export type ComputeProvider = {
  id: string;
  name: string;
  type: ComputeProviderType;
  description: string;
  icon: string;
  available: boolean;
};

export type ComputeOption = {
  id: string;
  providerId: string;
  name: string;
  gpu: string;
  vram: string;
  pricePerHour: number;
  available: boolean;
};

export type CostEstimate = {
  provider: string;
  gpu: string;
  estimatedHours: number;
  costPerHour: number;
  totalCost: number;
};

export type LaunchJobRequest = {
  providerType: ComputeProviderType;
  optionId: string;
  configYaml: string;
  projectName?: string;
};

export type LaunchJobResponse = {
  jobId: string;
  status: JobStatusType;
  providerType: ComputeProviderType;
  message: string;
  downloadUrl?: string;
  notebookUrl?: string;
};

export type JobStatusType = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type JobStatus = {
  jobId: string;
  status: JobStatusType;
  providerType: ComputeProviderType;
  progress?: number;
  metrics?: Record<string, number>;
  error?: string;
  downloadUrl?: string;
};
