import { apiClient } from '@/api/client.ts';
import type {
  ComputeProvider,
  ComputeOption,
  CostEstimate,
  LaunchJobRequest,
  LaunchJobResponse,
  JobStatus,
} from '@/types/index.ts';

export async function fetchComputeProviders(): Promise<ComputeProvider[]> {
  const { data } = await apiClient.get<ComputeProvider[]>('/compute/providers');
  return data;
}

export async function fetchComputeOptions(providerId?: string): Promise<ComputeOption[]> {
  const params = providerId ? { providerId } : {};
  const { data } = await apiClient.get<ComputeOption[]>('/compute/options', { params });
  return data;
}

export async function estimateCost(
  optionId: string,
  epochs: number,
  datasetSize: number,
): Promise<CostEstimate> {
  const { data } = await apiClient.post<CostEstimate>('/compute/estimate', {
    optionId,
    epochs,
    datasetSize,
  });
  return data;
}

export async function launchJob(request: LaunchJobRequest): Promise<LaunchJobResponse> {
  const { data } = await apiClient.post<LaunchJobResponse>('/compute/launch', request);
  return data;
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const { data } = await apiClient.get<JobStatus>(`/compute/jobs/${jobId}`);
  return data;
}

export async function setRunPodKey(apiKey: string): Promise<void> {
  await apiClient.post('/compute/runpod-key', { apiKey });
}

export function getNotebookDownloadUrl(jobId: string): string {
  return `/api/v1/compute/notebooks/${jobId}`;
}

export function getPackageDownloadUrl(jobId: string): string {
  return `/api/v1/compute/packages/${jobId}`;
}
