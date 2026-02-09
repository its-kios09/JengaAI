import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle2, RotateCcw } from 'lucide-react';
import { usePipelineStore } from '@/store/pipeline-store.ts';

export function TrainPanel() {
  const classes = usePipelineStore((s) => s.classes);
  const training = usePipelineStore((s) => s.training);
  const setTraining = usePipelineStore((s) => s.setTraining);

  const totalSamples = classes.reduce((sum, c) => sum + c.samples.length, 0);
  const canTrain = classes.length >= 2 && classes.every((c) => c.samples.length >= 1) && !training.isTraining;

  const startTraining = useCallback(() => {
    setTraining({ isTraining: true, isDone: false, currentEpoch: 0, metrics: [] });

    const totalEpochs = 10;
    let epoch = 0;

    const interval = setInterval(() => {
      epoch++;
      const progress = epoch / totalEpochs;
      const loss = 0.8 * Math.exp(-2.5 * progress) + 0.05;
      const accuracy = 0.5 + 0.45 * (1 - Math.exp(-3 * progress));

      setTraining({
        currentEpoch: epoch,
        metrics: [
          ...(usePipelineStore.getState().training.metrics || []),
          { epoch, loss: +loss.toFixed(4), accuracy: +accuracy.toFixed(4) },
        ],
      });

      if (epoch >= totalEpochs) {
        clearInterval(interval);
        setTraining({ isTraining: false, isDone: true });
      }
    }, 300);
  }, [setTraining]);

  const resetTraining = () => {
    setTraining({ isTraining: false, isDone: false, currentEpoch: 0, totalEpochs: 10, metrics: [] });
  };

  const progress = training.totalEpochs > 0 ? (training.currentEpoch / training.totalEpochs) * 100 : 0;
  const latestMetric = training.metrics[training.metrics.length - 1];

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 space-y-6">
      <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">Training</h2>

      {/* Stats */}
      <div className="text-center space-y-1">
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {classes.length} classes &middot; {totalSamples} samples
        </p>
        {!canTrain && !training.isTraining && !training.isDone && (
          <p className="text-xs text-danger-500">
            Need at least 2 classes with 1+ sample each
          </p>
        )}
      </div>

      {/* Train button / Progress / Done */}
      {!training.isTraining && !training.isDone && (
        <motion.button
          whileHover={canTrain ? { scale: 1.05 } : {}}
          whileTap={canTrain ? { scale: 0.95 } : {}}
          onClick={canTrain ? startTraining : undefined}
          disabled={!canTrain}
          className={`w-32 h-32 rounded-full flex flex-col items-center justify-center gap-2 text-white font-bold text-lg shadow-xl transition-all
            ${canTrain
              ? 'bg-gradient-to-br from-primary-500 to-accent-500 hover:shadow-2xl cursor-pointer'
              : 'bg-surface-300 dark:bg-surface-600 cursor-not-allowed'}`}
        >
          <Play size={28} />
          <span className="text-sm">Train</span>
        </motion.button>
      )}

      {training.isTraining && (
        <div className="w-full max-w-xs space-y-4">
          <div className="relative w-32 h-32 mx-auto">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="8" className="text-surface-200 dark:text-surface-700" />
              <motion.circle
                cx="64" cy="64" r="56" fill="none" strokeWidth="8"
                strokeLinecap="round"
                className="text-primary-500"
                strokeDasharray={351.86}
                animate={{ strokeDashoffset: 351.86 * (1 - progress / 100) }}
                transition={{ duration: 0.3 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-surface-900 dark:text-surface-100">{Math.round(progress)}%</span>
              <span className="text-xs text-surface-500">Epoch {training.currentEpoch}/{training.totalEpochs}</span>
            </div>
          </div>

          {/* Live metrics */}
          {latestMetric && (
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg bg-surface-50 dark:bg-surface-900 p-2">
                <p className="text-xs text-surface-500">Loss</p>
                <p className="text-lg font-bold text-surface-900 dark:text-surface-100">{latestMetric.loss.toFixed(3)}</p>
              </div>
              <div className="rounded-lg bg-surface-50 dark:bg-surface-900 p-2">
                <p className="text-xs text-surface-500">Accuracy</p>
                <p className="text-lg font-bold text-success-600 dark:text-success-400">{(latestMetric.accuracy * 100).toFixed(1)}%</p>
              </div>
            </div>
          )}

          {/* Loss chart mini */}
          <div className="h-16 flex items-end gap-0.5">
            {training.metrics.map((m, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${(m.loss / 0.85) * 100}%` }}
                className="flex-1 bg-primary-400 dark:bg-primary-500 rounded-t"
              />
            ))}
          </div>
        </div>
      )}

      {training.isDone && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          >
            <CheckCircle2 size={64} className="text-success-500" />
          </motion.div>
          <p className="text-lg font-bold text-surface-900 dark:text-surface-100">Training Complete!</p>
          {latestMetric && (
            <p className="text-sm text-surface-500">
              Final accuracy: <span className="font-semibold text-success-600 dark:text-success-400">{(latestMetric.accuracy * 100).toFixed(1)}%</span>
            </p>
          )}
          <button
            onClick={resetTraining}
            className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
          >
            <RotateCcw size={14} /> Retrain
          </button>
        </motion.div>
      )}
    </div>
  );
}
