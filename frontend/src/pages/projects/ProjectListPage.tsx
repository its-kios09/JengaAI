import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Grid3X3, List } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader.tsx';
import { SearchInput } from '@/components/common/SearchInput.tsx';
import { StatusBadge } from '@/components/common/StatusBadge.tsx';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { DataTable } from '@/components/common/DataTable.tsx';
import { useProjects } from '@/hooks/use-projects.ts';
import type { Project } from '@/types/index.ts';

export function ProjectListPage() {
  const { data: projects, isLoading } = useProjects();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const navigate = useNavigate();

  const handleSearch = useCallback((q: string) => setSearch(q), []);

  const filtered = projects?.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.taskType.includes(search.toLowerCase()),
  ) || [];

  const columns = [
    { key: 'name', header: 'Project', render: (p: Project) => (
      <div>
        <p className="font-medium text-surface-900 dark:text-surface-100">{p.name}</p>
        <p className="text-xs text-surface-500">{p.description.slice(0, 60)}...</p>
      </div>
    )},
    { key: 'taskType', header: 'Task', render: (p: Project) => <span className="capitalize">{p.taskType}</span> },
    { key: 'model', header: 'Model', render: (p: Project) => <span className="text-xs">{p.modelName}</span> },
    { key: 'accuracy', header: 'Accuracy', render: (p: Project) => p.accuracy ? `${(p.accuracy * 100).toFixed(1)}%` : '—' },
    { key: 'status', header: 'Status', render: (p: Project) => <StatusBadge status={p.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`${projects?.length || 0} projects`}
        actions={
          <Link to="/projects/new">
            <Button icon={<Plus size={16} />}>New Project</Button>
          </Link>
        }
      />

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 max-w-sm">
          <SearchInput placeholder="Search projects..." onSearch={handleSearch} />
        </div>
        <div className="flex border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'}`}
          >
            <Grid3X3 size={18} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 ${viewMode === 'table' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card className="hover:border-primary-300 dark:hover:border-primary-600 transition-colors h-full">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-surface-900 dark:text-surface-100">{project.name}</h3>
                      <p className="text-xs text-surface-500 capitalize mt-0.5">{project.taskType}</p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                  <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2 mb-4">{project.description}</p>
                  <div className="flex items-center justify-between text-xs text-surface-500">
                    <span>{project.modelName}</span>
                    {project.accuracy && <span className="font-medium">{(project.accuracy * 100).toFixed(1)}% acc</span>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <DataTable
            columns={columns}
            data={filtered}
            keyExtractor={(p) => p.id}
            loading={isLoading}
            emptyTitle="No projects found"
            onRowClick={(p) => navigate(`/projects/${p.id}`)}
          />
        </Card>
      )}
    </div>
  );
}
