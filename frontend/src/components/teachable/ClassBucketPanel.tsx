import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, Edit2, Check } from 'lucide-react';
import { usePipelineStore } from '@/store/pipeline-store.ts';
import { Button } from '@/components/ui/Button.tsx';

export function ClassBucketPanel() {
  const classes = usePipelineStore((s) => s.classes);
  const addClass = usePipelineStore((s) => s.addClass);
  const removeClass = usePipelineStore((s) => s.removeClass);
  const renameClass = usePipelineStore((s) => s.renameClass);
  const addSample = usePipelineStore((s) => s.addSample);
  const removeSample = usePipelineStore((s) => s.removeSample);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">Training Data</h2>
        <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={() => addClass(`Class ${classes.length + 1}`)}>
          Add Class
        </Button>
      </div>

      <AnimatePresence>
        {classes.map((cls) => (
          <motion.div
            key={cls.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 overflow-hidden"
          >
            <ClassBucketCard
              classId={cls.id}
              name={cls.name}
              color={cls.color}
              samples={cls.samples}
              onRename={(name) => renameClass(cls.id, name)}
              onRemove={() => removeClass(cls.id)}
              onAddSample={(text) => addSample(cls.id, text)}
              onRemoveSample={(sampleId) => removeSample(cls.id, sampleId)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

type ClassBucketCardProps = {
  classId: string;
  name: string;
  color: string;
  samples: { id: string; text: string }[];
  onRename: (name: string) => void;
  onRemove: () => void;
  onAddSample: (text: string) => void;
  onRemoveSample: (id: string) => void;
};

function ClassBucketCard({ classId: _classId, name, color, samples, onRename, onRemove, onAddSample, onRemoveSample }: ClassBucketCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [sampleText, setSampleText] = useState('');
  const [expanded, setExpanded] = useState(true);

  const handleRename = () => {
    if (editName.trim()) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const handleAddSample = () => {
    if (sampleText.trim()) {
      onAddSample(sampleText.trim());
      setSampleText('');
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-100 dark:border-surface-700/50">
        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1">
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              className="flex-1 text-sm font-semibold bg-transparent border-b border-primary-500 outline-none text-surface-900 dark:text-surface-100 py-0.5"
            />
            <button onClick={handleRename} className="p-1 text-success-500 hover:bg-success-50 dark:hover:bg-success-900/20 rounded">
              <Check size={14} />
            </button>
          </div>
        ) : (
          <button onClick={() => setExpanded(!expanded)} className="flex-1 text-left">
            <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">{name}</span>
            <span className="text-xs text-surface-400 ml-2">{samples.length} samples</span>
          </button>
        )}
        {!isEditing && (
          <div className="flex items-center gap-1">
            <button onClick={() => { setIsEditing(true); setEditName(name); }} className="p-1 rounded text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700">
              <Edit2 size={13} />
            </button>
            <button onClick={onRemove} className="p-1 rounded text-surface-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20">
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Samples */}
      {expanded && (
        <div className="px-4 py-3 space-y-2">
          <AnimatePresence>
            {samples.map((sample) => (
              <motion.div
                key={sample.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 group"
              >
                <p className="flex-1 text-xs text-surface-600 dark:text-surface-400 bg-surface-50 dark:bg-surface-900 rounded-lg px-3 py-2 leading-relaxed">
                  {sample.text}
                </p>
                <button
                  onClick={() => onRemoveSample(sample.id)}
                  className="p-1 rounded text-surface-300 hover:text-danger-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1"
                >
                  <X size={12} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add sample input */}
          <div className="flex gap-2 mt-2">
            <textarea
              value={sampleText}
              onChange={(e) => setSampleText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddSample(); } }}
              placeholder="Type a text sample..."
              rows={2}
              className="flex-1 text-xs rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500 placeholder:text-surface-400"
            />
            <button
              onClick={handleAddSample}
              disabled={!sampleText.trim()}
              className="self-end p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
