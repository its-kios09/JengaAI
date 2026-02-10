import type { Dataset, DatasetPreview, LabelDistribution } from '@/types/index.ts';
import { delay, mockDatasets, mockDatasetPreview, mockLabelDistribution } from '@/lib/mock-data.ts';

export async function fetchDatasets(): Promise<Dataset[]> {
  await delay(400);
  return mockDatasets;
}

export async function fetchDataset(id: string): Promise<Dataset> {
  await delay(300);
  const dataset = mockDatasets.find((d) => d.id === id);
  if (!dataset) throw new Error('Dataset not found');
  return dataset;
}

export async function fetchDatasetPreview(id: string): Promise<DatasetPreview> {
  await delay(300);
  void id;
  return mockDatasetPreview;
}

export async function fetchLabelDistribution(id: string): Promise<LabelDistribution[]> {
  await delay(200);
  void id;
  return mockLabelDistribution;
}

export async function uploadDataset(_file: File): Promise<Dataset> {
  await delay(1500);
  return {
    id: `ds_${Date.now()}`,
    name: _file.name,
    description: 'Uploaded dataset',
    format: 'csv',
    size: _file.size,
    rowCount: 1000,
    columnCount: 4,
    columns: ['text', 'label', 'source', 'date'],
    status: 'ready',
    createdAt: new Date().toISOString(),
  };
}
