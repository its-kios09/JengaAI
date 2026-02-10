import { FileText, Tags, Heart, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/Input.tsx';
import { Textarea } from '@/components/ui/Textarea.tsx';
import { Select } from '@/components/ui/Select.tsx';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import { useWizardStore } from '@/store/wizard-store.ts';
import type { TaskType } from '@/types/index.ts';

const taskTypes: { value: TaskType; label: string; description: string; icon: typeof FileText }[] = [
  { value: 'classification', label: 'Classification', description: 'Categorize text into predefined classes', icon: FileText },
  { value: 'ner', label: 'Named Entity Recognition', description: 'Extract entities like names, amounts, organizations', icon: Tags },
  { value: 'sentiment', label: 'Sentiment Analysis', description: 'Detect positive, negative, or neutral sentiment', icon: Heart },
  { value: 'regression', label: 'Regression', description: 'Predict a continuous numerical value from text', icon: TrendingUp },
];

const modelOptions = [
  { value: 'bert-base-multilingual-cased', label: 'BERT Multilingual (Cased)' },
  { value: 'xlm-roberta-base', label: 'XLM-RoBERTa Base' },
  { value: 'distilbert-base-multilingual-cased', label: 'DistilBERT Multilingual' },
  { value: 'bert-base-uncased', label: 'BERT Base (Uncased)' },
];

export function TaskSelectionStep() {
  const { projectName, description, taskType, modelName, updateField } = useWizardStore();

  return (
    <div className="space-y-6">
      <Input
        label="Project Name"
        value={projectName}
        onChange={(e) => updateField('projectName', e.target.value)}
        placeholder="e.g., M-PESA Fraud Detection"
      />
      <Textarea
        label="Description (optional)"
        value={description}
        onChange={(e) => updateField('description', e.target.value)}
        placeholder="Describe what this model will do..."
        rows={3}
      />

      <div>
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">Task Type</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {taskTypes.map((task) => (
            <button
              key={task.value}
              onClick={() => updateField('taskType', task.value)}
              className="text-left"
            >
              <Card className={`transition-colors ${taskType === task.value ? 'border-primary-500 dark:border-primary-400 ring-1 ring-primary-500' : 'hover:border-surface-300 dark:hover:border-surface-600'}`}>
                <CardContent className="flex items-start gap-3 py-3">
                  <task.icon size={20} className={`mt-0.5 shrink-0 ${taskType === task.value ? 'text-primary-500' : 'text-surface-400'}`} />
                  <div>
                    <p className="font-medium text-surface-900 dark:text-surface-100 text-sm">{task.label}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{task.description}</p>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </div>

      <Select
        label="Base Model"
        value={modelName}
        onChange={(e) => updateField('modelName', e.target.value)}
        options={modelOptions}
      />
    </div>
  );
}
