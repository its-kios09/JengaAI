import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Project } from '@/types/project.ts';
import { StatusBadge } from '@/components/common/StatusBadge.tsx';
import { MiniPipelineDiagram } from './MiniPipelineDiagram.tsx';

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  const isRunning = project.status === 'training';

  return (
    <Link
      to={`/projects/${project.id}`}
      className={`block rounded-xl border bg-white dark:bg-surface-800 shadow-sm hover:shadow-lg transition-all group
        ${isRunning
          ? 'border-primary-300 dark:border-primary-700'
          : 'border-surface-200 dark:border-surface-700'}`}
    >
      {/* Running indicator bar */}
      {isRunning && (
        <div className="h-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-t-xl animate-pulse" />
      )}

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {project.name}
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400 capitalize mt-0.5">
              {project.taskType} &middot; {project.modelName.split('/').pop()}
            </p>
          </div>
          <StatusBadge status={project.status} />
        </div>

        {/* Mini pipeline diagram */}
        <MiniPipelineDiagram status={project.status} />

        {/* Metrics */}
        <div className="flex items-center justify-between pt-2 border-t border-surface-100 dark:border-surface-700/50">
          <div className="flex gap-4">
            {project.accuracy != null && (
              <div>
                <p className="text-[10px] text-surface-400 uppercase">Accuracy</p>
                <p className="text-sm font-bold text-surface-900 dark:text-surface-100">{(project.accuracy * 100).toFixed(1)}%</p>
              </div>
            )}
            {project.f1Score != null && (
              <div>
                <p className="text-[10px] text-surface-400 uppercase">F1</p>
                <p className="text-sm font-bold text-surface-900 dark:text-surface-100">{(project.f1Score * 100).toFixed(1)}%</p>
              </div>
            )}
          </div>
          <ArrowRight size={14} className="text-surface-300 group-hover:text-primary-500 transition-colors" />
        </div>
      </div>
    </Link>
  );
}
