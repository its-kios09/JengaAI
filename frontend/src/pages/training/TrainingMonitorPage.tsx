import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Square } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader.tsx';
import { StatusBadge } from '@/components/common/StatusBadge.tsx';
import { LoadingSpinner } from '@/components/common/LoadingSpinner.tsx';
import { MetricCard } from '@/components/common/MetricCard.tsx';
import { LineChartWidget } from '@/components/common/LineChartWidget.tsx';
import { Card, CardHeader, CardContent } from '@/components/ui/Card.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { useTrainingJob, useTrainingLogs, useTrainingConfig, useStopTraining } from '@/hooks/use-training.ts';

export function TrainingMonitorPage() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading } = useTrainingJob(id || '');
  const { data: logs } = useTrainingLogs(id || '');
  const { data: config } = useTrainingConfig(id || '');
  const stopTraining = useStopTraining();

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!job) return <div className="text-center py-20 text-surface-500">Training job not found</div>;

  const lossData = job.metrics.epochTimestamps.map((ts, i) => ({
    epoch: ts,
    'Train Loss': job.metrics.trainLoss[i],
    'Val Loss': job.metrics.valLoss[i],
  }));

  const accuracyData = job.metrics.epochTimestamps.map((ts, i) => ({
    epoch: ts,
    Accuracy: job.metrics.accuracy[i],
    'F1 Score': job.metrics.f1Score[i],
  }));

  const latestAcc = job.metrics.accuracy.length > 0 ? job.metrics.accuracy[job.metrics.accuracy.length - 1] : 0;
  const latestF1 = job.metrics.f1Score.length > 0 ? job.metrics.f1Score[job.metrics.f1Score.length - 1] : 0;

  return (
    <div>
      <Link to="/training" className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 mb-4">
        <ArrowLeft size={16} /> Back to Training
      </Link>

      <PageHeader
        title={job.projectName}
        subtitle={`Job ${job.id}`}
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge status={job.status} />
            {job.status === 'running' && (
              <Button variant="danger" icon={<Square size={16} />} onClick={() => stopTraining.mutate(job.id)} loading={stopTraining.isPending}>
                Stop
              </Button>
            )}
          </div>
        }
      />

      {/* Progress bar */}
      {job.status === 'running' && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-surface-600 dark:text-surface-400">
              Epoch {job.currentEpoch}/{job.totalEpochs}
            </span>
            {job.estimatedTimeRemaining && (
              <span className="text-surface-500">{job.estimatedTimeRemaining} remaining</span>
            )}
          </div>
          <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${job.progress}%` }} />
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Accuracy" value={`${(latestAcc * 100).toFixed(1)}%`} />
        <MetricCard label="F1 Score" value={`${(latestF1 * 100).toFixed(1)}%`} />
        <MetricCard label="Epoch" value={`${job.currentEpoch}/${job.totalEpochs}`} />
        <MetricCard label="Progress" value={`${job.progress}%`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><h3 className="font-semibold text-surface-900 dark:text-surface-100">Loss</h3></CardHeader>
          <CardContent>
            <LineChartWidget
              data={lossData}
              lines={[
                { key: 'Train Loss', color: '#3b82f6', label: 'Train Loss' },
                { key: 'Val Loss', color: '#ef4444', label: 'Val Loss' },
              ]}
              xKey="epoch"
              height={250}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h3 className="font-semibold text-surface-900 dark:text-surface-100">Accuracy & F1</h3></CardHeader>
          <CardContent>
            <LineChartWidget
              data={accuracyData}
              lines={[
                { key: 'Accuracy', color: '#22c55e', label: 'Accuracy' },
                { key: 'F1 Score', color: '#d946ef', label: 'F1 Score' },
              ]}
              xKey="epoch"
              height={250}
            />
          </CardContent>
        </Card>
      </div>

      {/* Config + Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {config && (
          <Card>
            <CardHeader><h3 className="font-semibold text-surface-900 dark:text-surface-100">Configuration</h3></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {Object.entries(config).map(([key, val]) => (
                  <div key={key}>
                    <dt className="text-xs text-surface-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</dt>
                    <dd className="font-medium text-surface-900 dark:text-surface-100">{String(val)}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        )}

        {logs && (
          <Card>
            <CardHeader><h3 className="font-semibold text-surface-900 dark:text-surface-100">Logs</h3></CardHeader>
            <CardContent className="p-0">
              <div className="max-h-80 overflow-y-auto font-mono text-xs">
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className={`px-4 py-1.5 border-b border-surface-100 dark:border-surface-700/50 flex gap-3
                      ${log.level === 'error' ? 'bg-danger-50 dark:bg-danger-900/10' : log.level === 'warning' ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`}
                  >
                    <span className="text-surface-400 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className={`shrink-0 uppercase w-12 ${
                      log.level === 'error' ? 'text-danger-500' : log.level === 'warning' ? 'text-amber-500' : 'text-surface-400'
                    }`}>
                      {log.level}
                    </span>
                    <span className="text-surface-700 dark:text-surface-300">{log.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
