import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTrainingJobs, fetchTrainingJob, fetchTrainingLogs, fetchTrainingConfig, startTraining, stopTraining } from '@/api/training.ts';

export function useTrainingJobs() {
  return useQuery({ queryKey: ['training-jobs'], queryFn: fetchTrainingJobs });
}

export function useTrainingJob(id: string) {
  return useQuery({
    queryKey: ['training-jobs', id],
    queryFn: () => fetchTrainingJob(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const job = query.state.data;
      return job?.status === 'running' ? 5000 : false;
    },
  });
}

export function useTrainingLogs(jobId: string) {
  return useQuery({ queryKey: ['training-jobs', jobId, 'logs'], queryFn: () => fetchTrainingLogs(jobId), enabled: !!jobId });
}

export function useTrainingConfig(jobId: string) {
  return useQuery({ queryKey: ['training-jobs', jobId, 'config'], queryFn: () => fetchTrainingConfig(jobId), enabled: !!jobId });
}

export function useStartTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => startTraining(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training-jobs'] }),
  });
}

export function useStopTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => stopTraining(jobId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training-jobs'] }),
  });
}
