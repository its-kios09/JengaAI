import { useState } from 'react';
import { Input } from '@/components/ui/Input.tsx';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import { useWizardStore } from '@/store/wizard-store.ts';

export function ConfigStep() {
  const { config, updateConfig } = useWizardStore();
  const [advanced, setAdvanced] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-surface-700 dark:text-surface-300">Training Configuration</h3>
        <button
          onClick={() => setAdvanced(!advanced)}
          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
        >
          {advanced ? 'Simple mode' : 'Advanced mode'}
        </button>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-surface-600 dark:text-surface-400 mb-1">Epochs</label>
              <input
                type="range"
                min={1}
                max={20}
                value={config.epochs}
                onChange={(e) => updateConfig({ epochs: Number(e.target.value) })}
                className="w-full accent-primary-500"
              />
              <div className="flex justify-between text-xs text-surface-400 mt-1">
                <span>1</span>
                <span className="font-medium text-surface-700 dark:text-surface-200">{config.epochs}</span>
                <span>20</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-surface-600 dark:text-surface-400 mb-1">Batch Size</label>
              <input
                type="range"
                min={8}
                max={128}
                step={8}
                value={config.batchSize}
                onChange={(e) => updateConfig({ batchSize: Number(e.target.value) })}
                className="w-full accent-primary-500"
              />
              <div className="flex justify-between text-xs text-surface-400 mt-1">
                <span>8</span>
                <span className="font-medium text-surface-700 dark:text-surface-200">{config.batchSize}</span>
                <span>128</span>
              </div>
            </div>
          </div>

          {advanced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-surface-200 dark:border-surface-700">
              <Input
                label="Learning Rate"
                type="number"
                step="0.00001"
                value={config.learningRate}
                onChange={(e) => updateConfig({ learningRate: Number(e.target.value) })}
              />
              <Input
                label="Max Sequence Length"
                type="number"
                value={config.maxSeqLength}
                onChange={(e) => updateConfig({ maxSeqLength: Number(e.target.value) })}
              />
              <Input
                label="Warmup Steps"
                type="number"
                value={config.warmupSteps}
                onChange={(e) => updateConfig({ warmupSteps: Number(e.target.value) })}
              />
              <Input
                label="Weight Decay"
                type="number"
                step="0.001"
                value={config.weightDecay}
                onChange={(e) => updateConfig({ weightDecay: Number(e.target.value) })}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
