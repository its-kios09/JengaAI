export type DatasetFormat = 'csv' | 'json' | 'jsonl';

export type DatasetStatus = 'uploading' | 'processing' | 'ready' | 'error';

export type Dataset = {
  id: string;
  name: string;
  description: string;
  format: DatasetFormat;
  size: number;
  rowCount: number;
  columnCount: number;
  columns: string[];
  status: DatasetStatus;
  textColumn?: string;
  labelColumn?: string;
  createdAt: string;
};

export type DatasetPreview = {
  headers: string[];
  rows: string[][];
  totalRows: number;
};

export type DatasetUploadResponse = {
  dataset: Dataset;
  preview: DatasetPreview;
};

export type LabelDistribution = {
  label: string;
  count: number;
  percentage: number;
};
