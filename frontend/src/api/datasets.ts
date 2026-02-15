import type { Dataset, DatasetPreview, LabelDistribution } from '@/types/index.ts';
import { apiClient } from '@/api/client';

export async function fetchDatasets(): Promise<Dataset[]> {
  const res = await apiClient.get('/datasets');
  return res.data;
}

export async function fetchDataset(id: string): Promise<Dataset> {
  const res = await apiClient.get(`/datasets/${id}`);
  return res.data;
}

export async function fetchDatasetPreview(id: string): Promise<DatasetPreview> {
  const res = await apiClient.get(`/datasets/${id}/preview`);
  return res.data;
}

export async function fetchLabelDistribution(id: string): Promise<LabelDistribution[]> {
  const res = await apiClient.get(`/datasets/${id}/distribution`);
  return res.data;
}

export async function uploadDataset(file: File): Promise<Dataset> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.post('/datasets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function deleteDataset(id: string): Promise<void> {
  await apiClient.delete(`/datasets/${id}`);
}
