import { ClassBucketPanel } from '@/components/teachable/ClassBucketPanel.tsx';
import { TrainPanel } from '@/components/teachable/TrainPanel.tsx';
import { OutputPanel } from '@/components/teachable/OutputPanel.tsx';

export function TeachableMachinePage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-6">
      {/* Header */}
      <div className="px-6 py-3 border-b border-surface-200 dark:border-surface-700 bg-gradient-to-r from-primary-600 to-accent-600">
        <h1 className="text-lg font-bold text-white">Teachable Machine</h1>
        <p className="text-sm text-white/70">Add text samples, train in seconds, test instantly</p>
      </div>

      {/* Three-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel 1: Data */}
        <div className="w-1/3 border-r border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 overflow-hidden flex flex-col">
          <ClassBucketPanel />
        </div>

        {/* Panel 2: Train */}
        <div className="w-1/3 border-r border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 overflow-hidden flex flex-col">
          <TrainPanel />
        </div>

        {/* Panel 3: Output */}
        <div className="w-1/3 bg-white dark:bg-surface-800 overflow-hidden flex flex-col">
          <OutputPanel />
        </div>
      </div>
    </div>
  );
}
