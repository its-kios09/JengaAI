import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader.tsx';
import { StatusBadge } from '@/components/common/StatusBadge.tsx';
import { DataTable } from '@/components/common/DataTable.tsx';
import { Card } from '@/components/ui/Card.tsx';
import { useTrainingJobs } from '@/hooks/use-training.ts';
import type { TrainingJob, TrainingStatus } from '@/types/index.ts';

const FILTER_TABS: { label: string; value: TrainingStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Running', value: 'running' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Queued', value: 'queued' },
];

export function TrainingListPage() {
  const { data: jobs, isLoading } = useTrainingJobs();
  const [filter, setFilter] = useState<TrainingStatus | 'all'>('all');
  const navigate = useNavigate();

  const handleRowClick = useCallback((job: TrainingJob) => navigate(`/training/${job.id}`), [navigate]);

  const filtered = filter === 'all' ? jobs || [] : (jobs || []).filter((j) => j.status === filter);

  const columns = [
    { key: 'project', header: 'Project', render: (j: TrainingJob) => (
      <p className="font-medium text-surface-900 dark:text-surface-100">{j.projectName}</p>
    )},
    { key: 'progress', header: 'Progress', render: (j: TrainingJob) => (
      <div className="flex items-center gap-3 min-w-32">
        <div className="flex-1 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${j.status === 'failed' ? 'bg-danger-500' : j.status === 'running' ? 'bg-primary-500' : 'bg-success-500'}`}
            style={{ width: `${j.progress}%` }}
          />
        </div>
        <span className="text-xs text-surface-500 w-8">{j.progress}%</span>
      </div>
    )},
    { key: 'epoch', header: 'Epoch', render: (j: TrainingJob) => `${j.currentEpoch}/${j.totalEpochs}` },
    { key: 'accuracy', header: 'Best Acc', render: (j: TrainingJob) => {
      const acc = j.metrics.accuracy;
      return acc.length > 0 ? `${(Math.max(...acc) * 100).toFixed(1)}%` : '—';
    }},
    { key: 'status', header: 'Status', render: (j: TrainingJob) => <StatusBadge status={j.status} /> },
    { key: 'started', header: 'Started', render: (j: TrainingJob) => new Date(j.startedAt).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }) },
  ];

  return (
    <div>
      <PageHeader title="Training Jobs" subtitle={`${jobs?.length || 0} total jobs`} />

      <div className="flex gap-1 mb-6">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
              ${filter === tab.value
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(j) => j.id}
          loading={isLoading}
          emptyTitle="No training jobs"
          emptyDescription="Start training a project to see jobs here."
          onRowClick={handleRowClick}
        />
      </Card>
    </div>
  );
}
