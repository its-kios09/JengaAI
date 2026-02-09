import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader.tsx';
import { SearchInput } from '@/components/common/SearchInput.tsx';
import { StatusBadge } from '@/components/common/StatusBadge.tsx';
import { DataTable } from '@/components/common/DataTable.tsx';
import { FileUploader } from '@/components/common/FileUploader.tsx';
import { Card } from '@/components/ui/Card.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { Modal } from '@/components/ui/Modal.tsx';
import { useDatasets, useUploadDataset } from '@/hooks/use-datasets.ts';
import type { Dataset } from '@/types/index.ts';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function DatasetListPage() {
  const { data: datasets, isLoading } = useDatasets();
  const uploadDataset = useUploadDataset();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const handleSearch = useCallback((q: string) => setSearch(q), []);

  const filtered = datasets?.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()),
  ) || [];

  const columns = [
    { key: 'name', header: 'Name', render: (d: Dataset) => (
      <p className="font-medium text-surface-900 dark:text-surface-100">{d.name}</p>
    )},
    { key: 'format', header: 'Format', render: (d: Dataset) => <span className="uppercase text-xs">{d.format}</span> },
    { key: 'rows', header: 'Rows', render: (d: Dataset) => d.rowCount.toLocaleString() },
    { key: 'size', header: 'Size', render: (d: Dataset) => formatBytes(d.size) },
    { key: 'status', header: 'Status', render: (d: Dataset) => <StatusBadge status={d.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Datasets"
        subtitle={`${datasets?.length || 0} datasets`}
        actions={<Button icon={<Plus size={16} />} onClick={() => setShowUpload(true)}>Upload Dataset</Button>}
      />

      <div className="max-w-sm mb-6">
        <SearchInput placeholder="Search datasets..." onSearch={handleSearch} />
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(d) => d.id}
          loading={isLoading}
          emptyTitle="No datasets found"
          emptyDescription="Upload your first dataset to get started."
          onRowClick={(d) => navigate(`/datasets/${d.id}`)}
        />
      </Card>

      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="Upload Dataset">
        <FileUploader
          onFileSelect={async (file) => {
            await uploadDataset.mutateAsync(file);
            setShowUpload(false);
          }}
          uploading={uploadDataset.isPending}
        />
      </Modal>
    </div>
  );
}
