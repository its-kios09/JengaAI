import type { User, Project, Dataset, DatasetPreview, LabelDistribution, TrainingJob, TrainingLogEntry, TrainingConfigSummary, InferenceModel, Template, ComputeProvider, ComputeOption } from '@/types/index.ts';

export const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Users ───────────────────────────────────────────────────────
export const mockUser: User = {
  id: 'usr_001',
  email: 'analyst@jenga.ai',
  fullName: 'Amina Wanjiku',
  role: 'admin',
  createdAt: '2025-11-15T08:00:00Z',
};

// ─── Projects ────────────────────────────────────────────────────
export const mockProjects: Project[] = [
  {
    id: 'proj_001',
    name: 'M-PESA Fraud Detection',
    description: 'Classify mobile money transactions as fraudulent or legitimate using SMS and USSD logs.',
    taskType: 'classification',
    status: 'trained',
    modelName: 'bert-base-multilingual-cased',
    datasetId: 'ds_001',
    datasetName: 'M-PESA Transactions 2025',
    accuracy: 0.946,
    f1Score: 0.931,
    createdAt: '2025-12-01T10:00:00Z',
    updatedAt: '2026-01-15T14:30:00Z',
  },
  {
    id: 'proj_002',
    name: 'Hate Speech Monitor (Swahili)',
    description: 'Detect hate speech and incitement in Swahili social media posts targeting ethnic groups.',
    taskType: 'classification',
    status: 'training',
    modelName: 'xlm-roberta-base',
    datasetId: 'ds_002',
    datasetName: 'KE Social Media Corpus',
    accuracy: 0.872,
    f1Score: 0.858,
    createdAt: '2026-01-05T09:00:00Z',
    updatedAt: '2026-02-06T11:00:00Z',
  },
  {
    id: 'proj_003',
    name: 'Corruption Entity Extractor',
    description: 'Extract persons, organizations, and monetary amounts from anti-corruption investigation documents.',
    taskType: 'ner',
    status: 'trained',
    modelName: 'bert-base-multilingual-cased',
    datasetId: 'ds_003',
    datasetName: 'EACC Investigation Reports',
    accuracy: 0.912,
    f1Score: 0.897,
    createdAt: '2025-11-20T08:00:00Z',
    updatedAt: '2026-01-10T16:00:00Z',
  },
  {
    id: 'proj_004',
    name: 'Public Sentiment Tracker',
    description: 'Monitor public sentiment towards government policies from news comments and social media.',
    taskType: 'sentiment',
    status: 'deployed',
    modelName: 'distilbert-base-multilingual-cased',
    datasetId: 'ds_004',
    datasetName: 'KE News Comments',
    accuracy: 0.889,
    f1Score: 0.874,
    createdAt: '2025-10-15T07:00:00Z',
    updatedAt: '2026-02-01T09:00:00Z',
  },
  {
    id: 'proj_005',
    name: 'Cyber Threat Classifier',
    description: 'Classify cyber threat intelligence reports by threat type: phishing, malware, ransomware, social engineering.',
    taskType: 'classification',
    status: 'draft',
    modelName: 'bert-base-uncased',
    createdAt: '2026-02-05T12:00:00Z',
    updatedAt: '2026-02-05T12:00:00Z',
  },
  {
    id: 'proj_006',
    name: 'Tax Evasion Risk Scorer',
    description: 'Predict tax evasion risk score from KRA filing descriptions and financial narratives.',
    taskType: 'regression',
    status: 'failed',
    modelName: 'xlm-roberta-base',
    datasetId: 'ds_005',
    datasetName: 'KRA Filings Sample',
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-25T08:00:00Z',
  },
];

// ─── Datasets ────────────────────────────────────────────────────
export const mockDatasets: Dataset[] = [
  {
    id: 'ds_001',
    name: 'M-PESA Transactions 2025',
    description: 'Anonymized M-PESA transaction SMS logs with fraud labels.',
    format: 'csv',
    size: 15_400_000,
    rowCount: 48_500,
    columnCount: 6,
    columns: ['transaction_id', 'sms_text', 'amount', 'sender_type', 'timestamp', 'is_fraud'],
    status: 'ready',
    textColumn: 'sms_text',
    labelColumn: 'is_fraud',
    createdAt: '2025-11-28T10:00:00Z',
  },
  {
    id: 'ds_002',
    name: 'KE Social Media Corpus',
    description: 'Swahili and Sheng social media posts annotated for hate speech detection.',
    format: 'jsonl',
    size: 8_200_000,
    rowCount: 25_000,
    columnCount: 4,
    columns: ['text', 'label', 'source', 'language'],
    status: 'ready',
    textColumn: 'text',
    labelColumn: 'label',
    createdAt: '2026-01-03T08:00:00Z',
  },
  {
    id: 'ds_003',
    name: 'EACC Investigation Reports',
    description: 'Named entity annotated excerpts from Ethics and Anti-Corruption Commission reports.',
    format: 'json',
    size: 5_600_000,
    rowCount: 12_300,
    columnCount: 3,
    columns: ['text', 'entities', 'doc_id'],
    status: 'ready',
    textColumn: 'text',
    labelColumn: 'entities',
    createdAt: '2025-11-18T09:00:00Z',
  },
  {
    id: 'ds_004',
    name: 'KE News Comments',
    description: 'News article comments with sentiment labels from major Kenyan publications.',
    format: 'csv',
    size: 12_000_000,
    rowCount: 35_000,
    columnCount: 5,
    columns: ['comment_text', 'sentiment', 'source', 'article_topic', 'date'],
    status: 'ready',
    textColumn: 'comment_text',
    labelColumn: 'sentiment',
    createdAt: '2025-10-10T07:00:00Z',
  },
  {
    id: 'ds_005',
    name: 'KRA Filings Sample',
    description: 'Sample tax filing descriptions with evasion risk scores.',
    format: 'csv',
    size: 3_200_000,
    rowCount: 8_500,
    columnCount: 4,
    columns: ['filing_text', 'risk_score', 'sector', 'filing_year'],
    status: 'ready',
    textColumn: 'filing_text',
    labelColumn: 'risk_score',
    createdAt: '2026-01-18T10:00:00Z',
  },
];

export const mockDatasetPreview: DatasetPreview = {
  headers: ['transaction_id', 'sms_text', 'amount', 'sender_type', 'timestamp', 'is_fraud'],
  rows: [
    ['TXN001', 'Umepokea KES 5,000 kutoka kwa John Kamau. Salio lako ni KES 12,350.', '5000', 'registered', '2025-11-01 08:23:15', 'legitimate'],
    ['TXN002', 'Congratulations! You won KES 100,000. Send KES 500 to claim.', '500', 'unregistered', '2025-11-01 09:45:02', 'fraud'],
    ['TXN003', 'Umetuma KES 2,500 kwa 0712XXXXXX. Salio lako ni KES 9,850.', '2500', 'registered', '2025-11-01 10:12:33', 'legitimate'],
    ['TXN004', 'MPESA reversal: Send PIN to 0700XXXXXX to complete. Ref: QKL4X9.', '0', 'unregistered', '2025-11-01 11:05:18', 'fraud'],
    ['TXN005', 'Umelipa KES 1,200 kwa Safaricom. Salio lako ni KES 8,650.', '1200', 'registered', '2025-11-01 12:30:45', 'legitimate'],
  ],
  totalRows: 48_500,
};

export const mockLabelDistribution: LabelDistribution[] = [
  { label: 'legitimate', count: 41_225, percentage: 85.0 },
  { label: 'fraud', count: 7_275, percentage: 15.0 },
];

// ─── Training ────────────────────────────────────────────────────
export const mockTrainingJobs: TrainingJob[] = [
  {
    id: 'job_001',
    projectId: 'proj_001',
    projectName: 'M-PESA Fraud Detection',
    status: 'completed',
    progress: 100,
    currentEpoch: 5,
    totalEpochs: 5,
    startedAt: '2026-01-14T10:00:00Z',
    completedAt: '2026-01-14T12:30:00Z',
    metrics: {
      trainLoss: [0.68, 0.42, 0.28, 0.19, 0.14],
      valLoss: [0.55, 0.38, 0.31, 0.27, 0.25],
      accuracy: [0.72, 0.84, 0.90, 0.93, 0.946],
      f1Score: [0.68, 0.81, 0.87, 0.91, 0.931],
      learningRate: [5e-5, 4.5e-5, 3.5e-5, 2e-5, 1e-5],
      epochTimestamps: ['10:00', '10:30', '11:00', '11:30', '12:00'],
    },
  },
  {
    id: 'job_002',
    projectId: 'proj_002',
    projectName: 'Hate Speech Monitor (Swahili)',
    status: 'running',
    progress: 60,
    currentEpoch: 3,
    totalEpochs: 5,
    startedAt: '2026-02-06T09:00:00Z',
    estimatedTimeRemaining: '45 min',
    metrics: {
      trainLoss: [0.72, 0.48, 0.33],
      valLoss: [0.61, 0.44, 0.38],
      accuracy: [0.68, 0.79, 0.85],
      f1Score: [0.62, 0.75, 0.82],
      learningRate: [5e-5, 4e-5, 3e-5],
      epochTimestamps: ['09:00', '09:20', '09:40'],
    },
  },
  {
    id: 'job_003',
    projectId: 'proj_006',
    projectName: 'Tax Evasion Risk Scorer',
    status: 'failed',
    progress: 40,
    currentEpoch: 2,
    totalEpochs: 5,
    startedAt: '2026-01-24T14:00:00Z',
    completedAt: '2026-01-24T15:00:00Z',
    metrics: {
      trainLoss: [0.95, 0.88],
      valLoss: [0.92, 0.95],
      accuracy: [0.45, 0.48],
      f1Score: [0.38, 0.41],
      learningRate: [5e-5, 4.5e-5],
      epochTimestamps: ['14:00', '14:30'],
    },
  },
  {
    id: 'job_004',
    projectId: 'proj_003',
    projectName: 'Corruption Entity Extractor',
    status: 'completed',
    progress: 100,
    currentEpoch: 8,
    totalEpochs: 8,
    startedAt: '2026-01-08T08:00:00Z',
    completedAt: '2026-01-08T14:00:00Z',
    metrics: {
      trainLoss: [0.75, 0.52, 0.38, 0.29, 0.22, 0.18, 0.15, 0.13],
      valLoss: [0.65, 0.48, 0.40, 0.35, 0.32, 0.30, 0.29, 0.28],
      accuracy: [0.65, 0.76, 0.83, 0.87, 0.89, 0.90, 0.91, 0.912],
      f1Score: [0.60, 0.72, 0.80, 0.84, 0.87, 0.88, 0.89, 0.897],
      learningRate: [5e-5, 4.8e-5, 4.2e-5, 3.5e-5, 2.8e-5, 2e-5, 1.5e-5, 1e-5],
      epochTimestamps: ['08:00', '08:45', '09:30', '10:15', '11:00', '11:45', '12:30', '13:15'],
    },
  },
];

export const mockTrainingLogs: TrainingLogEntry[] = [
  { timestamp: '2026-02-06T09:00:00Z', level: 'info', message: 'Training started — model: xlm-roberta-base, dataset: KE Social Media Corpus' },
  { timestamp: '2026-02-06T09:00:05Z', level: 'info', message: 'Loading tokenizer: xlm-roberta-base' },
  { timestamp: '2026-02-06T09:00:12Z', level: 'info', message: 'Dataset loaded: 25,000 samples (20,000 train / 5,000 val)' },
  { timestamp: '2026-02-06T09:00:15Z', level: 'info', message: 'Using device: cuda:0 (NVIDIA A100 40GB)' },
  { timestamp: '2026-02-06T09:00:20Z', level: 'info', message: 'AMP enabled (fp16), gradient clipping: 1.0' },
  { timestamp: '2026-02-06T09:05:00Z', level: 'info', message: 'Epoch 1/5 — train_loss: 0.72, val_loss: 0.61, accuracy: 0.68, f1: 0.62' },
  { timestamp: '2026-02-06T09:10:00Z', level: 'warning', message: 'Learning rate warmup complete, switching to cosine decay' },
  { timestamp: '2026-02-06T09:20:00Z', level: 'info', message: 'Epoch 2/5 — train_loss: 0.48, val_loss: 0.44, accuracy: 0.79, f1: 0.75' },
  { timestamp: '2026-02-06T09:25:00Z', level: 'info', message: 'Checkpoint saved: best_model_epoch2.pt (val_loss improved)' },
  { timestamp: '2026-02-06T09:40:00Z', level: 'info', message: 'Epoch 3/5 — train_loss: 0.33, val_loss: 0.38, accuracy: 0.85, f1: 0.82' },
  { timestamp: '2026-02-06T09:40:05Z', level: 'info', message: 'Checkpoint saved: best_model_epoch3.pt (val_loss improved)' },
];

export const mockTrainingConfig: TrainingConfigSummary = {
  modelName: 'xlm-roberta-base',
  taskType: 'classification',
  learningRate: 5e-5,
  batchSize: 32,
  epochs: 5,
  maxSeqLength: 256,
  warmupSteps: 500,
  weightDecay: 0.01,
};

// ─── Inference ───────────────────────────────────────────────────
export const mockInferenceModels: InferenceModel[] = [
  { id: 'model_001', name: 'M-PESA Fraud v1.2', projectId: 'proj_001', taskType: 'classification', accuracy: 0.946, createdAt: '2026-01-15T14:30:00Z' },
  { id: 'model_002', name: 'Corruption NER v2.0', projectId: 'proj_003', taskType: 'ner', accuracy: 0.912, createdAt: '2026-01-10T16:00:00Z' },
  { id: 'model_003', name: 'Sentiment Tracker v1.0', projectId: 'proj_004', taskType: 'sentiment', accuracy: 0.889, createdAt: '2026-02-01T09:00:00Z' },
];

// ─── Templates ───────────────────────────────────────────────────
export const mockTemplates: Template[] = [
  {
    id: 'tpl_001',
    name: 'Mobile Money Fraud Detection',
    description: 'Pre-configured pipeline for detecting fraudulent M-PESA and mobile money transactions from SMS logs.',
    category: 'fraud',
    taskType: 'classification',
    modelName: 'bert-base-multilingual-cased',
    icon: 'Shield',
    tags: ['M-PESA', 'fraud', 'SMS', 'fintech'],
    estimatedTrainingTime: '2-3 hours',
    accuracy: 0.94,
  },
  {
    id: 'tpl_002',
    name: 'Hate Speech Detection (Swahili)',
    description: 'Multilingual hate speech and incitement classifier optimized for Swahili and Sheng content.',
    category: 'content-moderation',
    taskType: 'classification',
    modelName: 'xlm-roberta-base',
    icon: 'MessageSquareWarning',
    tags: ['hate speech', 'Swahili', 'social media', 'moderation'],
    estimatedTrainingTime: '3-4 hours',
    accuracy: 0.87,
  },
  {
    id: 'tpl_003',
    name: 'Corruption Entity Extraction',
    description: 'Extract persons, organizations, amounts, and locations from investigation documents.',
    category: 'compliance',
    taskType: 'ner',
    modelName: 'bert-base-multilingual-cased',
    icon: 'Scale',
    tags: ['NER', 'corruption', 'EACC', 'investigation'],
    estimatedTrainingTime: '4-6 hours',
    accuracy: 0.91,
  },
  {
    id: 'tpl_004',
    name: 'Cyber Threat Intelligence',
    description: 'Classify threat reports by type: phishing, malware, ransomware, social engineering, APT.',
    category: 'cybersecurity',
    taskType: 'classification',
    modelName: 'bert-base-uncased',
    icon: 'Bug',
    tags: ['cyber', 'threat', 'malware', 'phishing'],
    estimatedTrainingTime: '2-3 hours',
    accuracy: 0.92,
  },
  {
    id: 'tpl_005',
    name: 'Public Sentiment Monitor',
    description: 'Track public sentiment towards government policies from news and social media.',
    category: 'intelligence',
    taskType: 'sentiment',
    modelName: 'distilbert-base-multilingual-cased',
    icon: 'TrendingUp',
    tags: ['sentiment', 'government', 'policy', 'opinion'],
    estimatedTrainingTime: '1-2 hours',
    accuracy: 0.88,
  },
  {
    id: 'tpl_006',
    name: 'Financial Crime Narrative Analysis',
    description: 'Analyze financial narratives for money laundering and tax evasion indicators.',
    category: 'fraud',
    taskType: 'classification',
    modelName: 'xlm-roberta-base',
    icon: 'Banknote',
    tags: ['money laundering', 'KRA', 'tax', 'financial crime'],
    estimatedTrainingTime: '3-4 hours',
    accuracy: 0.86,
  },
];

// ─── Compute ─────────────────────────────────────────────────────
export const mockComputeProviders: ComputeProvider[] = [
  { id: 'cp_001', name: 'Jenga Platform', type: 'platform', description: 'Managed GPU instances optimized for Jenga-AI workloads. No setup required.', icon: 'Server', available: true },
  { id: 'cp_002', name: 'RunPod', type: 'runpod', description: 'On-demand GPU cloud with competitive pricing. Connect your RunPod API key.', icon: 'Cloud', available: true },
  { id: 'cp_003', name: 'Google Colab', type: 'colab', description: 'Free and Pro tier GPU access via Google Colab notebooks.', icon: 'Laptop', available: true },
  { id: 'cp_004', name: 'Kaggle', type: 'kaggle', description: 'Free GPU notebooks with 30h/week quota. Great for experimentation.', icon: 'Database', available: true },
  { id: 'cp_005', name: 'Local / Download', type: 'local', description: 'Download model and training scripts to run on your own hardware.', icon: 'HardDrive', available: true },
];

export const mockComputeOptions: ComputeOption[] = [
  { id: 'co_001', providerId: 'cp_001', name: 'Jenga A100', gpu: 'NVIDIA A100 40GB', vram: '40 GB', pricePerHour: 2.50, available: true },
  { id: 'co_002', providerId: 'cp_001', name: 'Jenga T4', gpu: 'NVIDIA T4 16GB', vram: '16 GB', pricePerHour: 0.80, available: true },
  { id: 'co_003', providerId: 'cp_002', name: 'RunPod A100', gpu: 'NVIDIA A100 80GB', vram: '80 GB', pricePerHour: 1.99, available: true },
  { id: 'co_004', providerId: 'cp_002', name: 'RunPod RTX 4090', gpu: 'NVIDIA RTX 4090 24GB', vram: '24 GB', pricePerHour: 0.69, available: true },
  { id: 'co_005', providerId: 'cp_003', name: 'Colab Free', gpu: 'NVIDIA T4 16GB', vram: '16 GB', pricePerHour: 0, available: true },
  { id: 'co_006', providerId: 'cp_003', name: 'Colab Pro', gpu: 'NVIDIA A100 40GB', vram: '40 GB', pricePerHour: 0.10, available: true },
  { id: 'co_007', providerId: 'cp_004', name: 'Kaggle GPU', gpu: 'NVIDIA T4 x2', vram: '32 GB', pricePerHour: 0, available: true },
];

// ─── Activity Feed ───────────────────────────────────────────────
export type ActivityItem = {
  id: string;
  type: 'project_created' | 'training_started' | 'training_completed' | 'model_deployed' | 'dataset_uploaded' | 'training_failed';
  message: string;
  timestamp: string;
};

export const mockActivity: ActivityItem[] = [
  { id: 'act_001', type: 'training_completed', message: 'M-PESA Fraud Detection training completed — 94.6% accuracy', timestamp: '2026-02-06T14:30:00Z' },
  { id: 'act_002', type: 'training_started', message: 'Hate Speech Monitor (Swahili) training started', timestamp: '2026-02-06T09:00:00Z' },
  { id: 'act_003', type: 'dataset_uploaded', message: 'KRA Filings Sample dataset uploaded (8,500 rows)', timestamp: '2026-02-05T16:00:00Z' },
  { id: 'act_004', type: 'project_created', message: 'New project created: Cyber Threat Classifier', timestamp: '2026-02-05T12:00:00Z' },
  { id: 'act_005', type: 'model_deployed', message: 'Public Sentiment Tracker deployed to production', timestamp: '2026-02-01T09:00:00Z' },
  { id: 'act_006', type: 'training_failed', message: 'Tax Evasion Risk Scorer training failed — OOM error', timestamp: '2026-01-25T08:00:00Z' },
  { id: 'act_007', type: 'training_completed', message: 'Corruption Entity Extractor training completed — 91.2% accuracy', timestamp: '2026-01-10T16:00:00Z' },
];
