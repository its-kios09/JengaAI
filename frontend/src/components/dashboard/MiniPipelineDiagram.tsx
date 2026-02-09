import type { ProjectStatus } from '@/types/project.ts';

type MiniPipelineDiagramProps = {
  status: ProjectStatus;
};

const stages = ['Data', 'Model', 'Train', 'Deploy'];

function getStageState(stageIndex: number, status: ProjectStatus): 'done' | 'active' | 'pending' {
  const statusMap: Record<ProjectStatus, number> = { draft: 0, training: 2, trained: 3, deployed: 4, failed: 2 };
  const activeStage = statusMap[status];
  if (stageIndex < activeStage) return 'done';
  if (stageIndex === activeStage) return 'active';
  return 'pending';
}

const stateColors = {
  done: 'bg-success-500',
  active: 'bg-primary-500',
  pending: 'bg-surface-300 dark:bg-surface-600',
};

const stateLineColors = {
  done: 'bg-success-400',
  active: 'bg-primary-400',
  pending: 'bg-surface-200 dark:bg-surface-700',
};

export function MiniPipelineDiagram({ status }: MiniPipelineDiagramProps) {
  return (
    <div className="flex items-center gap-0.5">
      {stages.map((stage, i) => {
        const state = getStageState(i, status);
        const isRunning = state === 'active' && status === 'training';
        return (
          <div key={stage} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-2.5 h-2.5 rounded-full ${stateColors[state]} ${isRunning ? 'animate-pulse' : ''}`}
                title={stage}
              />
              <span className="text-[8px] text-surface-400 mt-0.5">{stage}</span>
            </div>
            {i < stages.length - 1 && (
              <div className={`w-4 h-0.5 ${stateLineColors[state]} mb-3 mx-0.5`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
