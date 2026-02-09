import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { useWizardStore } from '@/store/wizard-store.ts';
import { useCreateProject } from '@/hooks/use-projects.ts';
import { TaskSelectionStep } from './steps/TaskSelectionStep.tsx';
import { DatasetUploadStep } from './steps/DatasetUploadStep.tsx';
import { ConfigStep } from './steps/ConfigStep.tsx';
import { ReviewStep } from './steps/ReviewStep.tsx';

const STEPS = ['Task & Model', 'Dataset', 'Configuration', 'Review'];

export function ProjectWizardPage() {
  const { currentStep, nextStep, prevStep, projectName, taskType, modelName, config, reset } = useWizardStore();
  const createProject = useCreateProject();
  const navigate = useNavigate();

  const canNext = () => {
    if (currentStep === 0) return !!projectName && !!taskType && !!modelName;
    return true;
  };

  const handleSubmit = async () => {
    if (!taskType) return;
    await createProject.mutateAsync({
      name: projectName,
      description: '',
      taskType,
      modelName,
      config,
    });
    reset();
    navigate('/projects');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-2">Create New Project</h1>
      <p className="text-sm text-surface-500 dark:text-surface-400 mb-8">Set up your NLP model in a few steps.</p>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0
                  ${
                    i < currentStep
                      ? 'bg-success-500 text-white'
                      : i === currentStep
                        ? 'bg-primary-600 text-white'
                        : 'bg-surface-200 dark:bg-surface-700 text-surface-500'
                  }`}
              >
                {i < currentStep ? <Check size={16} /> : i + 1}
              </div>
              <span
                className={`text-sm hidden sm:block ${i <= currentStep ? 'text-surface-900 dark:text-surface-100 font-medium' : 'text-surface-400'}`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-3 ${i < currentStep ? 'bg-success-500' : 'bg-surface-200 dark:bg-surface-700'}`} />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="mb-8">
        {currentStep === 0 && <TaskSelectionStep />}
        {currentStep === 1 && <DatasetUploadStep />}
        {currentStep === 2 && <ConfigStep />}
        {currentStep === 3 && <ReviewStep />}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={prevStep} disabled={currentStep === 0}>
          Back
        </Button>
        {currentStep < 3 ? (
          <Button onClick={nextStep} disabled={!canNext()}>
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit} loading={createProject.isPending}>
            Create Project
          </Button>
        )}
      </div>
    </div>
  );
}
