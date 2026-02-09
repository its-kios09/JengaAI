import { useQuery, useMutation } from '@tanstack/react-query';
import {
  fetchComputeProviders,
  fetchComputeOptions,
  estimateCost,
  launchJob,
  getJobStatus,
  setRunPodKey,
} from '@/api/compute.ts';
import type { LaunchJobRequest } from '@/types/index.ts';

export function useComputeProviders() {
  return useQuery({ queryKey: ['compute-providers'], queryFn: fetchComputeProviders });
}

export function useComputeOptions(providerId?: string) {
  return useQuery({
    queryKey: ['compute-options', providerId],
    queryFn: () => fetchComputeOptions(providerId),
  });
}

export function useEstimateCost() {
  return useMutation({
    mutationFn: ({ optionId, epochs, datasetSize }: { optionId: string; epochs: number; datasetSize: number }) =>
      estimateCost(optionId, epochs, datasetSize),
  });
}

export function useLaunchJob() {
  return useMutation({
    mutationFn: (request: LaunchJobRequest) => launchJob(request),
  });
}

export function useJobStatus(jobId: string | null) {
  return useQuery({
    queryKey: ['job-status', jobId],
    queryFn: () => getJobStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'pending' || status === 'running') return 3000;
      return false;
    },
  });
}

export function useSetRunPodKey() {
  return useMutation({
    mutationFn: (apiKey: string) => setRunPodKey(apiKey),
  });
}
