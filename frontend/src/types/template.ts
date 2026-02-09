export type TemplateCategory = 'fraud' | 'cybersecurity' | 'content-moderation' | 'intelligence' | 'compliance';

export type Template = {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  taskType: string;
  modelName: string;
  icon: string;
  tags: string[];
  estimatedTrainingTime: string;
  accuracy: number;
};
