import { useState } from 'react';
import { FileUploader } from '@/components/common/FileUploader.tsx';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import { Select } from '@/components/ui/Select.tsx';
import { PieChartWidget } from '@/components/common/PieChartWidget.tsx';
import { useWizardStore } from '@/store/wizard-store.ts';
import { useDatasets } from '@/hooks/use-datasets.ts';
import { mockDatasetPreview, mockLabelDistribution } from '@/lib/mock-data.ts';

export function DatasetUploadStep() {
  const { datasetId, textColumn, labelColumn, updateField } = useWizardStore();
  const { data: datasets } = useDatasets();
  const [showPreview, setShowPreview] = useState(false);

  const handleFileSelect = (file: File) => {
    updateField('datasetFile', file);
    setShowPreview(true);
  };

  const handleExistingDataset = (id: string) => {
    updateField('datasetId', id);
    if (id) setShowPreview(true);
  };

  const preview = showPreview || datasetId ? mockDatasetPreview : null;
  const distribution = showPreview || datasetId ? mockLabelDistribution.map((d) => ({ name: d.label, value: d.count })) : [];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">Upload New Dataset</label>
        <FileUploader onFileSelect={handleFileSelect} />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700" />
        <span className="text-sm text-surface-400">or</span>
        <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700" />
      </div>

      <Select
        label="Use Existing Dataset"
        value={datasetId || ''}
        onChange={(e) => handleExistingDataset(e.target.value)}
        options={(datasets || []).map((d) => ({ value: d.id, label: `${d.name} (${d.rowCount.toLocaleString()} rows)` }))}
        placeholder="Select a dataset..."
      />

      {preview && (
        <>
          <Card>
            <CardContent>
              <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-3">Preview</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-surface-200 dark:border-surface-700">
                      {preview.headers.map((h) => (
                        <th key={h} className="text-left px-3 py-2 font-medium text-surface-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-b border-surface-100 dark:border-surface-700/50">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 text-surface-700 dark:text-surface-300 max-w-48 truncate">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-surface-400 mt-2">{preview.totalRows.toLocaleString()} total rows</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Text Column"
              value={textColumn}
              onChange={(e) => updateField('textColumn', e.target.value)}
              options={preview.headers.map((h) => ({ value: h, label: h }))}
              placeholder="Select column..."
            />
            <Select
              label="Label Column"
              value={labelColumn}
              onChange={(e) => updateField('labelColumn', e.target.value)}
              options={preview.headers.map((h) => ({ value: h, label: h }))}
              placeholder="Select column..."
            />
          </div>

          {distribution.length > 0 && (
            <Card>
              <CardContent>
                <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-3">Label Distribution</h4>
                <PieChartWidget data={distribution} height={200} />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
