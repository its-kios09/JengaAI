import { Link } from 'react-router-dom';
import {
  FolderKanban, Database, Activity, Zap, Workflow, Sparkles,
  CheckCircle2, AlertCircle, Upload, Rocket, PlayCircle, XCircle,
} from 'lucide-react';
import { MetricCard } from '@/components/common/MetricCard.tsx';
import { ProjectCard } from '@/components/dashboard/ProjectCard.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { Card, CardHeader, CardContent } from '@/components/ui/Card.tsx';
import { useProjects } from '@/hooks/use-projects.ts';
import { useTrainingJobs } from '@/hooks/use-training.ts';
import { useDatasets } from '@/hooks/use-datasets.ts';
import { mockActivity } from '@/lib/mock-data.ts';
import type { ActivityItem } from '@/lib/mock-data.ts';

const activityIcons: Record<ActivityItem['type'], typeof CheckCircle2> = {
  training_completed: CheckCircle2,
  training_started: PlayCircle,
  training_failed: XCircle,
  dataset_uploaded: Upload,
  project_created: FolderKanban,
  model_deployed: Rocket,
};

const activityColors: Record<ActivityItem['type'], string> = {
  training_completed: 'text-success-500',
  training_started: 'text-primary-500',
  training_failed: 'text-danger-500',
  dataset_uploaded: 'text-accent-500',
  project_created: 'text-surface-500',
  model_deployed: 'text-success-500',
};

export function DashboardPage() {
  const { data: projects } = useProjects();
  const { data: jobs } = useTrainingJobs();
  const { data: datasets } = useDatasets();

  const activeJobs = jobs?.filter((j) => j.status === 'running').length || 0;
  const deployedModels = projects?.filter((p) => p.status === 'deployed').length || 0;

  return (
    <div className="space-y-8">
      {/* Hero CTA */}
      <div className="rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-6 md:p-8 text-white shadow-xl">
        <div className="max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Build Your ML Pipeline</h1>
          <p className="text-white/70 mb-6 text-sm md:text-base">
            Design visually, train interactively, deploy instantly. Choose your path below.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/pipeline/new">
              <Button size="lg" className="!bg-white !text-primary-700 hover:!bg-primary-50 !shadow-lg">
                <Workflow size={18} />
                Pipeline Editor
              </Button>
            </Link>
            <Link to="/teachable">
              <Button size="lg" variant="ghost" className="!text-white !border !border-white/30 hover:!bg-white/10">
                <Sparkles size={18} />
                Teachable Machine
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Projects" value={projects?.length || 0} trend={12} icon={<FolderKanban size={20} />} />
        <MetricCard label="Datasets" value={datasets?.length || 0} trend={8} icon={<Database size={20} />} />
        <MetricCard label="Active Training" value={activeJobs} icon={<Activity size={20} />} />
        <MetricCard label="Deployed Models" value={deployedModels} trend={25} icon={<Zap size={20} />} />
      </div>

      {/* Project grid + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Your Projects</h2>
            <Link to="/projects" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects?.slice(0, 4).map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>

        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Activity</h3>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-6 py-2">
              {mockActivity.slice(0, 6).map((item, i) => {
                const Icon = activityIcons[item.type] || AlertCircle;
                const color = activityColors[item.type] || 'text-surface-400';
                return (
                  <div key={item.id} className="flex gap-3 pb-4 relative">
                    {/* Timeline line */}
                    {i < 5 && (
                      <div className="absolute left-[11px] top-7 bottom-0 w-px bg-surface-200 dark:bg-surface-700" />
                    )}
                    <div className={`shrink-0 mt-0.5 ${color}`}>
                      <Icon size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-surface-700 dark:text-surface-300 leading-snug">{item.message}</p>
                      <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                        {new Date(item.timestamp).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
