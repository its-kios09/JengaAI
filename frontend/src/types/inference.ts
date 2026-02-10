export type InferenceModel = {
  id: string;
  name: string;
  projectId: string;
  taskType: string;
  accuracy: number;
  createdAt: string;
};

export type PredictionRequest = {
  modelId: string;
  text: string;
};

export type ClassificationResult = {
  label: string;
  confidence: number;
};

export type NEREntity = {
  text: string;
  label: string;
  start: number;
  end: number;
  confidence: number;
};

export type NERResult = {
  entities: NEREntity[];
  text: string;
};

export type SentimentResult = {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  breakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
};

export type PredictionResponse = {
  taskType: string;
  classification?: ClassificationResult[];
  ner?: NERResult;
  sentiment?: SentimentResult;
};
