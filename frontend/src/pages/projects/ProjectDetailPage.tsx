import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader.tsx';
import { StatusBadge } from '@/components/common/StatusBadge.tsx';
import { MetricCard } from '@/components/common/MetricCard.tsx';
import { LoadingSpinner } from '@/components/common/LoadingSpinner.tsx';
import { Card, CardHeader, CardContent } from '@/components/ui/Card.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/Tabs.tsx';
import { useProject } from '@/hooks/use-projects.ts';
import { useTrainingJobs } from '@/hooks/use-training.ts';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading } = useProject(id || '');
  const { data: allJobs } = useTrainingJobs();

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!project) return <div className="text-center py-20 text-surface-500">Project not found</div>;

  const projectJobs = allJobs?.filter((j) => j.projectId === project.id) || [];

  return (
    <div>
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 mb-4">
        <ArrowLeft size={16} /> Back to Projects
      </Link>

      <PageHeader
        title={project.name}
        subtitle={project.description}
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge status={project.status} />
            <Link to={`/training`}>
              <Button icon={<Play size={16} />} variant="secondary">Train</Button>
            </Link>
          </div>
        }
      />

      {/* Metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Task Type" value={project.taskType} />
        <MetricCard label="Model" value={project.modelName.split('/').pop() || project.modelName} />
        <MetricCard label="Accuracy" value={project.accuracy ? `${(project.accuracy * 100).toFixed(1)}%` : '—'} />
        <MetricCard label="F1 Score" value={project.f1Score ? `${(project.f1Score * 100).toFixed(1)}%` : '—'} />
      </div>

      <Tabs defaultTab="overview">
        <TabList>
          <Tab value="overview">Overview</Tab>
          <Tab value="dataset">Dataset</Tab>
          <Tab value="training">Training History</Tab>
        </TabList>

        <TabPanel value="overview">
          <Card>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-surface-500 dark:text-surface-400">Created</dt>
                  <dd className="text-sm font-medium text-surface-900 dark:text-surface-100 mt-1">
                    {new Date(project.createdAt).toLocaleDateString('en-KE', { dateStyle: 'long' })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-surface-500 dark:text-surface-400">Last Updated</dt>
                  <dd className="text-sm font-medium text-surface-900 dark:text-surface-100 mt-1">
                    {new Date(project.updatedAt).toLocaleDateString('en-KE', { dateStyle: 'long' })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-surface-500 dark:text-surface-400">Dataset</dt>
                  <dd className="text-sm font-medium text-surface-900 dark:text-surface-100 mt-1">
                    {project.datasetName || 'None attached'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-surface-500 dark:text-surface-400">Status</dt>
                  <dd className="mt-1"><StatusBadge status={project.status} /></dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value="dataset">
          <Card>
            <CardContent>
              {project.datasetId ? (
                <Link to={`/datasets/${project.datasetId}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                  View dataset: {project.datasetName}
                </Link>
              ) : (
                <p className="text-surface-500">No dataset attached to this project.</p>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value="training">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-surface-900 dark:text-surface-100">Training Jobs</h3>
            </CardHeader>
            <CardContent className="p-0">
              {projectJobs.length === 0 ? (
                <p className="px-6 py-8 text-center text-surface-500">No training history yet.</p>
              ) : (
                <div className="divide-y divide-surface-100 dark:divide-surface-700/50">
                  {projectJobs.map((job) => (
                    <Link
                      key={job.id}
                      to={`/training/${job.id}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-surface-900 dark:text-surface-100">{job.id}</p>
                        <p className="text-xs text-surface-500 mt-0.5">
                          Started {new Date(job.startedAt).toLocaleDateString('en-KE')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-surface-600 dark:text-surface-300">
                          {job.metrics.accuracy.length > 0
                            ? `${(job.metrics.accuracy[job.metrics.accuracy.length - 1] * 100).toFixed(1)}%`
                            : '—'}
                        </span>
                        <StatusBadge status={job.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabPanel>
      </Tabs>
    </div>
  );
}
