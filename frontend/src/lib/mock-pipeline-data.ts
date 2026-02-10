import type { PipelineNode, PipelineEdge } from '@/types/pipeline.ts';

type PipelineTemplate = {
  id: string;
  name: string;
  description: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
};

export const pipelineTemplates: PipelineTemplate[] = [
  {
    id: 'ptpl_001',
    name: 'M-PESA Fraud Detection',
    description: 'Classify mobile money transactions as fraudulent or legitimate',
    nodes: [
      {
        id: 'n1', type: 'data-source', position: { x: 50, y: 200 },
        data: { label: 'M-PESA Transactions', nodeType: 'data-source', status: 'configured', config: { datasetId: 'ds_001', datasetName: 'M-PESA Transactions 2025', format: 'csv', textColumn: 'sms_text', labelColumn: 'is_fraud' } },
      },
      {
        id: 'n2', type: 'preprocessor', position: { x: 350, y: 200 },
        data: { label: 'Text Cleaner', nodeType: 'preprocessor', status: 'configured', config: { lowercase: true, removeSpecialChars: false, maxLength: 256, tokenizer: 'bert-base-multilingual-cased' } },
      },
      {
        id: 'n3', type: 'model', position: { x: 650, y: 200 },
        data: { label: 'BERT Multilingual', nodeType: 'model', status: 'configured', config: { modelName: 'bert-base-multilingual-cased', taskType: 'classification', numLabels: 2 } },
      },
      {
        id: 'n4', type: 'training', position: { x: 950, y: 200 },
        data: { label: 'Training', nodeType: 'training', status: 'configured', config: { epochs: 5, learningRate: 5e-5, batchSize: 32, warmupSteps: 500 } },
      },
      {
        id: 'n5', type: 'deployment', position: { x: 1250, y: 200 },
        data: { label: 'Deploy API', nodeType: 'deployment', status: 'unconfigured', config: { target: 'api', replicas: 1 } },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'n1', target: 'n2' },
      { id: 'e2-3', source: 'n2', target: 'n3' },
      { id: 'e3-4', source: 'n3', target: 'n4' },
      { id: 'e4-5', source: 'n4', target: 'n5' },
    ],
  },
  {
    id: 'ptpl_002',
    name: 'Hate Speech Monitor (Swahili)',
    description: 'Detect hate speech in Swahili social media posts',
    nodes: [
      {
        id: 'n1', type: 'data-source', position: { x: 50, y: 200 },
        data: { label: 'Social Media Corpus', nodeType: 'data-source', status: 'configured', config: { datasetId: 'ds_002', datasetName: 'KE Social Media Corpus', format: 'jsonl', textColumn: 'text', labelColumn: 'label' } },
      },
      {
        id: 'n2', type: 'preprocessor', position: { x: 350, y: 200 },
        data: { label: 'Text Preprocessor', nodeType: 'preprocessor', status: 'configured', config: { lowercase: true, removeSpecialChars: true, maxLength: 128, tokenizer: 'xlm-roberta-base' } },
      },
      {
        id: 'n3', type: 'model', position: { x: 650, y: 200 },
        data: { label: 'XLM-RoBERTa', nodeType: 'model', status: 'configured', config: { modelName: 'xlm-roberta-base', taskType: 'classification', numLabels: 3 } },
      },
      {
        id: 'n4', type: 'training', position: { x: 950, y: 200 },
        data: { label: 'Training', nodeType: 'training', status: 'configured', config: { epochs: 5, learningRate: 5e-5, batchSize: 16, warmupSteps: 300 } },
      },
      {
        id: 'n5', type: 'deployment', position: { x: 1250, y: 200 },
        data: { label: 'Deploy API', nodeType: 'deployment', status: 'unconfigured', config: { target: 'api', replicas: 1 } },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'n1', target: 'n2' },
      { id: 'e2-3', source: 'n2', target: 'n3' },
      { id: 'e3-4', source: 'n3', target: 'n4' },
      { id: 'e4-5', source: 'n4', target: 'n5' },
    ],
  },
  {
    id: 'ptpl_003',
    name: 'Corruption Entity Extraction',
    description: 'Extract persons, organizations, and amounts from investigation docs',
    nodes: [
      {
        id: 'n1', type: 'data-source', position: { x: 50, y: 200 },
        data: { label: 'EACC Reports', nodeType: 'data-source', status: 'configured', config: { datasetId: 'ds_003', datasetName: 'EACC Investigation Reports', format: 'json', textColumn: 'text', labelColumn: 'entities' } },
      },
      {
        id: 'n2', type: 'preprocessor', position: { x: 350, y: 200 },
        data: { label: 'NER Preprocessor', nodeType: 'preprocessor', status: 'configured', config: { lowercase: false, removeSpecialChars: false, maxLength: 512, tokenizer: 'bert-base-multilingual-cased' } },
      },
      {
        id: 'n3', type: 'model', position: { x: 650, y: 200 },
        data: { label: 'BERT NER', nodeType: 'model', status: 'configured', config: { modelName: 'bert-base-multilingual-cased', taskType: 'ner', numLabels: 9 } },
      },
      {
        id: 'n4', type: 'training', position: { x: 950, y: 200 },
        data: { label: 'Training', nodeType: 'training', status: 'configured', config: { epochs: 8, learningRate: 3e-5, batchSize: 16, warmupSteps: 200 } },
      },
      {
        id: 'n5', type: 'deployment', position: { x: 1250, y: 200 },
        data: { label: 'Export Model', nodeType: 'deployment', status: 'unconfigured', config: { target: 'export', format: 'onnx' } },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'n1', target: 'n2' },
      { id: 'e2-3', source: 'n2', target: 'n3' },
      { id: 'e3-4', source: 'n3', target: 'n4' },
      { id: 'e4-5', source: 'n4', target: 'n5' },
    ],
  },
];
