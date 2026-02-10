import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { usePipelineStore } from '@/store/pipeline-store.ts';

export function OutputPanel() {
  const classes = usePipelineStore((s) => s.classes);
  const training = usePipelineStore((s) => s.training);
  const predictions = usePipelineStore((s) => s.predictions);
  const setPredictions = usePipelineStore((s) => s.setPredictions);

  const [inputText, setInputText] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const isReady = training.isDone;

  // Mock prediction: distribute confidence based on naive keyword matching
  useEffect(() => {
    if (!isReady || !inputText.trim()) {
      setPredictions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const text = inputText.toLowerCase();
      const scores = classes.map((cls) => {
        // Score based on how many class samples share words with input
        let score = 0;
        for (const sample of cls.samples) {
          const words = sample.text.toLowerCase().split(/\s+/);
          for (const word of words) {
            if (word.length > 3 && text.includes(word)) score += 1;
          }
        }
        return { classId: cls.id, className: cls.name, color: cls.color, rawScore: score + Math.random() * 0.5 };
      });

      const total = scores.reduce((sum, s) => sum + s.rawScore, 0) || 1;
      setPredictions(
        scores
          .map((s) => ({ classId: s.classId, className: s.className, confidence: s.rawScore / total, color: s.color }))
          .sort((a, b) => b.confidence - a.confidence),
      );
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputText, isReady, classes, setPredictions]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">Output</h2>

      {!isReady && (
        <div className="flex items-center justify-center h-48">
          <p className="text-sm text-surface-400 dark:text-surface-500 text-center">
            Train your model first to see live predictions
          </p>
        </div>
      )}

      {isReady && (
        <>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste text to classify..."
            rows={4}
            className="w-full text-sm rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800
              text-surface-900 dark:text-surface-100 px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500
              placeholder:text-surface-400"
          />

          {/* Confidence bars */}
          <div className="space-y-3">
            {predictions.map((pred) => (
              <div key={pred.classId} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: pred.color }} />
                    <span className="text-sm font-medium text-surface-800 dark:text-surface-200">{pred.className}</span>
                  </div>
                  <span className="text-sm font-bold text-surface-900 dark:text-surface-100">
                    {(pred.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: pred.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pred.confidence * 100}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>

          {inputText.trim() && predictions.length > 0 && (
            <div className="pt-3 border-t border-surface-200 dark:border-surface-700">
              <p className="text-xs text-surface-400 text-center">
                Predicted: <span className="font-semibold" style={{ color: predictions[0].color }}>{predictions[0].className}</span>
                {' '}({(predictions[0].confidence * 100).toFixed(1)}%)
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
