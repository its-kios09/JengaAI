import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDatasets,
  fetchDataset,
  fetchDatasetPreview,
  fetchLabelDistribution,
  uploadDataset,
  deleteDataset,
} from '@/api/datasets.ts';

export function useDatasets() {
  return useQuery({ queryKey: ['datasets'], queryFn: fetchDatasets });
}

export function useDataset(id: string) {
  return useQuery({ queryKey: ['datasets', id], queryFn: () => fetchDataset(id), enabled: !!id });
}

export function useDatasetPreview(id: string) {
  return useQuery({ queryKey: ['datasets', id, 'preview'], queryFn: () => fetchDatasetPreview(id), enabled: !!id });
}

export function useLabelDistribution(id: string) {
  return useQuery({ queryKey: ['datasets', id, 'distribution'], queryFn: () => fetchLabelDistribution(id), enabled: !!id });
}

export function useUploadDataset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadDataset(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['datasets'] }),
  });
}

export function useDeleteDataset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDataset(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['datasets'] }),
  });
}
