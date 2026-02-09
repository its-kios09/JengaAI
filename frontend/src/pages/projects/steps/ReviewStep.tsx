import { Card, CardContent } from '@/components/ui/Card.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { useWizardStore } from '@/store/wizard-store.ts';

export function ReviewStep() {
  const { projectName, description, taskType, modelName, datasetId, textColumn, labelColumn, config, setStep } = useWizardStore();

  const sections = [
    {
      title: 'Project Details',
      step: 0,
      items: [
        { label: 'Name', value: projectName },
        { label: 'Description', value: description || '(none)' },
        { label: 'Task Type', value: taskType || '(not selected)' },
        { label: 'Base Model', value: modelName },
      ],
    },
    {
      title: 'Dataset',
      step: 1,
      items: [
        { label: 'Dataset', value: datasetId || '(none)' },
        { label: 'Text Column', value: textColumn || '(not set)' },
        { label: 'Label Column', value: labelColumn || '(not set)' },
      ],
    },
    {
      title: 'Configuration',
      step: 2,
      items: [
        { label: 'Epochs', value: String(config.epochs) },
        { label: 'Batch Size', value: String(config.batchSize) },
        { label: 'Learning Rate', value: String(config.learningRate) },
        { label: 'Max Sequence Length', value: String(config.maxSeqLength) },
        { label: 'Warmup Steps', value: String(config.warmupSteps) },
        { label: 'Weight Decay', value: String(config.weightDecay) },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Review your project configuration</h3>
      {sections.map((section) => (
        <Card key={section.title}>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-100">{section.title}</h4>
              <Button variant="ghost" size="sm" onClick={() => setStep(section.step)}>
                Edit
              </Button>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
              {section.items.map((item) => (
                <div key={item.label}>
                  <dt className="text-xs text-surface-500 dark:text-surface-400">{item.label}</dt>
                  <dd className="text-sm text-surface-900 dark:text-surface-100 mt-0.5">{item.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
