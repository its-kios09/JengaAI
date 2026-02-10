import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader.tsx';
import { StatusBadge } from '@/components/common/StatusBadge.tsx';
import { LoadingSpinner } from '@/components/common/LoadingSpinner.tsx';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/Tabs.tsx';
import { BarChartWidget } from '@/components/common/BarChartWidget.tsx';
import { useDataset, useDatasetPreview, useLabelDistribution } from '@/hooks/use-datasets.ts';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function DatasetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: dataset, isLoading } = useDataset(id || '');
  const { data: preview } = useDatasetPreview(id || '');
  const { data: distribution } = useLabelDistribution(id || '');

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!dataset) return <div className="text-center py-20 text-surface-500">Dataset not found</div>;

  return (
    <div>
      <Link to="/datasets" className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 mb-4">
        <ArrowLeft size={16} /> Back to Datasets
      </Link>

      <PageHeader
        title={dataset.name}
        subtitle={dataset.description}
        actions={<StatusBadge status={dataset.status} />}
      />

      <Tabs defaultTab="preview">
        <TabList>
          <Tab value="preview">Preview</Tab>
          <Tab value="distribution">Distribution</Tab>
          <Tab value="info">Info</Tab>
        </TabList>

        <TabPanel value="preview">
          {preview && (
            <Card>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-200 dark:border-surface-700">
                        {preview.headers.map((h) => (
                          <th key={h} className="text-left px-3 py-2 font-medium text-surface-500 text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, i) => (
                        <tr key={i} className="border-b border-surface-100 dark:border-surface-700/50">
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-2 text-surface-700 dark:text-surface-300 max-w-64 truncate text-xs">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-surface-400 mt-3">Showing {preview.rows.length} of {preview.totalRows.toLocaleString()} rows</p>
              </CardContent>
            </Card>
          )}
        </TabPanel>

        <TabPanel value="distribution">
          {distribution && (
            <Card>
              <CardContent>
                <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-4">Label Distribution</h4>
                <BarChartWidget
                  data={distribution.map((d) => ({ name: d.label, count: d.count }))}
                  dataKey="count"
                  nameKey="name"
                  height={250}
                />
              </CardContent>
            </Card>
          )}
        </TabPanel>

        <TabPanel value="info">
          <Card>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div><dt className="text-xs text-surface-500">Format</dt><dd className="text-sm font-medium text-surface-900 dark:text-surface-100 uppercase">{dataset.format}</dd></div>
                <div><dt className="text-xs text-surface-500">Size</dt><dd className="text-sm font-medium text-surface-900 dark:text-surface-100">{formatBytes(dataset.size)}</dd></div>
                <div><dt className="text-xs text-surface-500">Rows</dt><dd className="text-sm font-medium text-surface-900 dark:text-surface-100">{dataset.rowCount.toLocaleString()}</dd></div>
                <div><dt className="text-xs text-surface-500">Columns</dt><dd className="text-sm font-medium text-surface-900 dark:text-surface-100">{dataset.columnCount}</dd></div>
                <div><dt className="text-xs text-surface-500">Text Column</dt><dd className="text-sm font-medium text-surface-900 dark:text-surface-100">{dataset.textColumn || '—'}</dd></div>
                <div><dt className="text-xs text-surface-500">Label Column</dt><dd className="text-sm font-medium text-surface-900 dark:text-surface-100">{dataset.labelColumn || '—'}</dd></div>
                <div><dt className="text-xs text-surface-500">Created</dt><dd className="text-sm font-medium text-surface-900 dark:text-surface-100">{new Date(dataset.createdAt).toLocaleDateString('en-KE', { dateStyle: 'long' })}</dd></div>
              </dl>
            </CardContent>
          </Card>
        </TabPanel>
      </Tabs>
    </div>
  );
}
