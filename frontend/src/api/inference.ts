import type { InferenceModel, PredictionResponse } from '@/types/index.ts';
import { delay, mockInferenceModels } from '@/lib/mock-data.ts';

export async function fetchInferenceModels(): Promise<InferenceModel[]> {
  await delay(300);
  return mockInferenceModels;
}

export async function predict(modelId: string, text: string): Promise<PredictionResponse> {
  await delay(1000);
  const model = mockInferenceModels.find((m) => m.id === modelId);
  if (!model) throw new Error('Model not found');

  if (model.taskType === 'classification') {
    return {
      taskType: 'classification',
      classification: [
        { label: 'fraud', confidence: 0.92 },
        { label: 'legitimate', confidence: 0.08 },
      ],
    };
  }

  if (model.taskType === 'ner') {
    return {
      taskType: 'ner',
      ner: {
        text,
        entities: [
          { text: 'John Kamau', label: 'PERSON', start: 0, end: 10, confidence: 0.95 },
          { text: 'KES 5,000,000', label: 'MONEY', start: 20, end: 33, confidence: 0.91 },
          { text: 'Kenya Revenue Authority', label: 'ORG', start: 45, end: 68, confidence: 0.88 },
        ],
      },
    };
  }

  return {
    taskType: 'sentiment',
    sentiment: {
      sentiment: 'negative',
      score: -0.72,
      breakdown: { positive: 0.12, negative: 0.76, neutral: 0.12 },
    },
  };
}
