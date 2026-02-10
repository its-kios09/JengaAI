import { create } from 'zustand';
import type { TaskType } from '@/types/index.ts';

type WizardState = {
  currentStep: number;
  projectName: string;
  description: string;
  taskType: TaskType | null;
  modelName: string;
  datasetId: string | null;
  datasetFile: File | null;
  textColumn: string;
  labelColumn: string;
  config: {
    learningRate: number;
    batchSize: number;
    epochs: number;
    maxSeqLength: number;
    warmupSteps: number;
    weightDecay: number;
  };
  templateId: string | null;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateField: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  updateConfig: (config: Partial<WizardState['config']>) => void;
  reset: () => void;
};

const defaultConfig = {
  learningRate: 5e-5,
  batchSize: 32,
  epochs: 5,
  maxSeqLength: 256,
  warmupSteps: 500,
  weightDecay: 0.01,
};

export const useWizardStore = create<WizardState>()((set) => ({
  currentStep: 0,
  projectName: '',
  description: '',
  taskType: null,
  modelName: 'bert-base-multilingual-cased',
  datasetId: null,
  datasetFile: null,
  textColumn: '',
  labelColumn: '',
  config: { ...defaultConfig },
  templateId: null,
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 3) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),
  updateField: (key, value) => set({ [key]: value }),
  updateConfig: (config) => set((state) => ({ config: { ...state.config, ...config } })),
  reset: () =>
    set({
      currentStep: 0,
      projectName: '',
      description: '',
      taskType: null,
      modelName: 'bert-base-multilingual-cased',
      datasetId: null,
      datasetFile: null,
      textColumn: '',
      labelColumn: '',
      config: { ...defaultConfig },
      templateId: null,
    }),
}));
