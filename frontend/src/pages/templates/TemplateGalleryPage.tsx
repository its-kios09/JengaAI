import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader.tsx';
import { SearchInput } from '@/components/common/SearchInput.tsx';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import { Badge } from '@/components/ui/Badge.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { useTemplates } from '@/hooks/use-templates.ts';
import { useWizardStore } from '@/store/wizard-store.ts';
import type { TemplateCategory } from '@/types/index.ts';

const CATEGORIES: { label: string; value: TemplateCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Fraud', value: 'fraud' },
  { label: 'Cybersecurity', value: 'cybersecurity' },
  { label: 'Content Moderation', value: 'content-moderation' },
  { label: 'Intelligence', value: 'intelligence' },
  { label: 'Compliance', value: 'compliance' },
];

function getIcon(name: string) {
  const icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[name];
  return icon || Icons.FileText;
}

export function TemplateGalleryPage() {
  const { data: templates } = useTemplates();
  const [category, setCategory] = useState<TemplateCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const wizardStore = useWizardStore();

  const handleSearch = useCallback((q: string) => setSearch(q), []);

  const filtered = (templates || []).filter((t) => {
    if (category !== 'all' && t.category !== category) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.tags.some((tag) => tag.includes(search.toLowerCase()))) return false;
    return true;
  });

  const handleUseTemplate = (template: typeof filtered[0]) => {
    // Open template in the pipeline editor
    const templateToPipeline: Record<string, string> = {
      'tpl_001': 'ptpl_001',
      'tpl_002': 'ptpl_002',
      'tpl_003': 'ptpl_003',
    };
    const pipelineId = templateToPipeline[template.id];
    if (pipelineId) {
      navigate(`/pipeline/${pipelineId}`);
    } else {
      // Fallback to legacy wizard for templates without a pipeline
      wizardStore.reset();
      wizardStore.updateField('projectName', template.name);
      wizardStore.updateField('taskType', template.taskType as 'classification' | 'ner' | 'sentiment' | 'regression');
      wizardStore.updateField('modelName', template.modelName);
      wizardStore.updateField('templateId', template.id);
      navigate('/projects/new');
    }
  };

  return (
    <div>
      <PageHeader title="Templates" subtitle="Pre-configured NLP pipelines for Kenyan national security use cases" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors
                ${category === cat.value
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium'
                  : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="w-full sm:w-64">
          <SearchInput placeholder="Search templates..." onSearch={handleSearch} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((template) => {
          const Icon = getIcon(template.icon);
          return (
            <Card key={template.id} className="flex flex-col">
              <CardContent className="flex-1 pt-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-surface-900 dark:text-surface-100">{template.name}</h3>
                    <p className="text-xs text-surface-500 capitalize">{template.taskType} &middot; {template.estimatedTrainingTime}</p>
                  </div>
                </div>
                <p className="text-sm text-surface-600 dark:text-surface-400 mb-3">{template.description}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="default">{tag}</Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-surface-600 dark:text-surface-300">{(template.accuracy * 100).toFixed(0)}% accuracy</span>
                  <Button size="sm" onClick={() => handleUseTemplate(template)}>Use Template</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
