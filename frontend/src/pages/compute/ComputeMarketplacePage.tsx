import { useState } from 'react';
import * as Icons from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader.tsx';
import { MetricCard } from '@/components/common/MetricCard.tsx';
import { Card, CardContent, CardHeader } from '@/components/ui/Card.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { Badge } from '@/components/ui/Badge.tsx';
import {
  useComputeProviders,
  useComputeOptions,
  useEstimateCost,
  useLaunchJob,
  useJobStatus,
  useSetRunPodKey,
} from '@/hooks/use-compute.ts';
import { getNotebookDownloadUrl, getPackageDownloadUrl } from '@/api/compute.ts';
import type { CostEstimate, ComputeProviderType, LaunchJobResponse } from '@/types/index.ts';

function getIcon(name: string) {
  const icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[name];
  return icon || Icons.Server;
}

const PROVIDER_ACTIONS: Record<ComputeProviderType, { label: string; icon: Icons.LucideIcon }> = {
  colab: { label: 'Open in Colab', icon: Icons.ExternalLink },
  kaggle: { label: 'Open in Kaggle', icon: Icons.ExternalLink },
  local: { label: 'Download Package', icon: Icons.Download },
  runpod: { label: 'Launch on RunPod', icon: Icons.Rocket },
  platform: { label: 'Train Now', icon: Icons.Play },
};

export function ComputeMarketplacePage() {
  const { data: providers } = useComputeProviders();
  const { data: options } = useComputeOptions();
  const estimateCost = useEstimateCost();
  const launchJob = useLaunchJob();
  const setRunPodKey = useSetRunPodKey();

  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [configYaml, setConfigYaml] = useState('');
  const [projectName, setProjectName] = useState('jenga_experiment');
  const [showConfig, setShowConfig] = useState(false);
  const [runpodKey, setRunpodKey] = useState('');
  const [showRunpodModal, setShowRunpodModal] = useState(false);
  const [activeJob, setActiveJob] = useState<LaunchJobResponse | null>(null);

  const { data: jobStatus } = useJobStatus(activeJob?.jobId ?? null);

  const filteredOptions = selectedProvider
    ? (options || []).filter((o) => o.providerId === selectedProvider)
    : options || [];

  const handleEstimate = async (optionId: string) => {
    const result = await estimateCost.mutateAsync({ optionId, epochs: 5, datasetSize: 25000 });
    setEstimate(result);
  };

  const handleLaunch = async (optionId: string, providerType: ComputeProviderType) => {
    if (!configYaml.trim()) {
      setShowConfig(true);
      return;
    }

    if (providerType === 'runpod' && !runpodKey) {
      setShowRunpodModal(true);
      return;
    }

    const result = await launchJob.mutateAsync({
      providerType,
      optionId,
      configYaml,
      projectName,
    });

    setActiveJob(result);

    // For notebook/package providers, trigger download immediately
    if (result.downloadUrl) {
      const url = providerType === 'local'
        ? getPackageDownloadUrl(result.jobId)
        : getNotebookDownloadUrl(result.jobId);
      window.open(url, '_blank');
    }
  };

  const handleSaveRunpodKey = async () => {
    if (runpodKey.trim()) {
      await setRunPodKey.mutateAsync(runpodKey);
      setShowRunpodModal(false);
    }
  };

  const getProviderType = (optionId: string): ComputeProviderType => {
    const option = (options || []).find((o) => o.id === optionId);
    if (!option) return 'platform';
    const provider = (providers || []).find((p) => p.id === option.providerId);
    return provider?.type ?? 'platform';
  };

  return (
    <div>
      <PageHeader title="Compute Marketplace" subtitle="Choose where to train your models" />

      {/* Provider cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {(providers || []).map((provider) => {
          const Icon = getIcon(provider.icon);
          const isSelected = selectedProvider === provider.id;
          return (
            <button
              key={provider.id}
              onClick={() => setSelectedProvider(isSelected ? null : provider.id)}
              className="text-left"
            >
              <Card className={`transition-colors h-full ${isSelected ? 'border-primary-500 ring-1 ring-primary-500' : 'hover:border-surface-300 dark:hover:border-surface-600'}`}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={20} className={isSelected ? 'text-primary-500' : 'text-surface-400'} />
                    <span className="font-semibold text-sm text-surface-900 dark:text-surface-100">{provider.name}</span>
                  </div>
                  <p className="text-xs text-surface-500 dark:text-surface-400 line-clamp-2">{provider.description}</p>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      {/* Config YAML input */}
      <Card className={`mb-6 ${showConfig ? '' : 'hidden'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-surface-900 dark:text-surface-100">Training Configuration</h3>
            <Button size="sm" variant="ghost" onClick={() => setShowConfig(!showConfig)}>
              {showConfig ? 'Hide' : 'Show'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100"
                placeholder="jenga_experiment"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">YAML Config</label>
              <textarea
                value={configYaml}
                onChange={(e) => setConfigYaml(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100"
                placeholder="Paste your experiment YAML config here..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {!showConfig && (
        <div className="mb-6">
          <Button size="sm" variant="outline" onClick={() => setShowConfig(true)}>
            <Icons.FileText size={14} className="mr-1" /> Set Config YAML
          </Button>
        </div>
      )}

      {/* Options table */}
      <Card className="mb-6">
        <CardHeader>
          <h3 className="font-semibold text-surface-900 dark:text-surface-100">
            {selectedProvider ? `Options for ${providers?.find((p) => p.id === selectedProvider)?.name}` : 'All Compute Options'}
          </h3>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700">
                  <th className="text-left px-4 py-3 font-medium text-surface-500">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-surface-500">GPU</th>
                  <th className="text-left px-4 py-3 font-medium text-surface-500">VRAM</th>
                  <th className="text-left px-4 py-3 font-medium text-surface-500">Price/hr</th>
                  <th className="text-left px-4 py-3 font-medium text-surface-500">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-surface-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOptions.map((option) => {
                  const providerType = getProviderType(option.id);
                  const action = PROVIDER_ACTIONS[providerType];
                  const ActionIcon = action.icon;
                  return (
                    <tr key={option.id} className="border-b border-surface-100 dark:border-surface-700/50">
                      <td className="px-4 py-3 font-medium text-surface-900 dark:text-surface-100">{option.name}</td>
                      <td className="px-4 py-3 text-surface-700 dark:text-surface-300 text-xs">{option.gpu}</td>
                      <td className="px-4 py-3 text-surface-700 dark:text-surface-300">{option.vram}</td>
                      <td className="px-4 py-3 text-surface-700 dark:text-surface-300">
                        {option.pricePerHour === 0 ? <Badge variant="success">Free</Badge> : `$${option.pricePerHour.toFixed(2)}`}
                      </td>
                      <td className="px-4 py-3"><Badge variant={option.available ? 'success' : 'danger'}>{option.available ? 'Available' : 'Busy'}</Badge></td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEstimate(option.id)}>
                          Estimate
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleLaunch(option.id, providerType)}
                          disabled={launchJob.isPending}
                        >
                          <ActionIcon size={14} className="mr-1" />
                          {action.label}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Cost estimate */}
      {estimate && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard label="Provider" value={estimate.provider} />
          <MetricCard label="GPU" value={estimate.gpu.split(' ').slice(1, 3).join(' ')} />
          <MetricCard label="Est. Hours" value={`${estimate.estimatedHours}h`} />
          <MetricCard label="Est. Cost" value={estimate.totalCost === 0 ? 'Free' : `$${estimate.totalCost.toFixed(2)}`} />
        </div>
      )}

      {/* Active job status */}
      {activeJob && (
        <Card className="mb-6">
          <CardHeader>
            <h3 className="font-semibold text-surface-900 dark:text-surface-100">Job Status</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge variant={
                  (jobStatus?.status ?? activeJob.status) === 'completed' ? 'success' :
                  (jobStatus?.status ?? activeJob.status) === 'failed' ? 'danger' :
                  'default'
                }>
                  {jobStatus?.status ?? activeJob.status}
                </Badge>
                <span className="text-sm text-surface-600 dark:text-surface-400">
                  {activeJob.message}
                </span>
              </div>
              {jobStatus?.progress != null && (
                <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all"
                    style={{ width: `${jobStatus.progress * 100}%` }}
                  />
                </div>
              )}
              {jobStatus?.error && (
                <p className="text-sm text-red-500">{jobStatus.error}</p>
              )}
              {activeJob.downloadUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const url = activeJob.providerType === 'local'
                      ? getPackageDownloadUrl(activeJob.jobId)
                      : getNotebookDownloadUrl(activeJob.jobId);
                    window.open(url, '_blank');
                  }}
                >
                  <Icons.Download size={14} className="mr-1" /> Download
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* RunPod API Key Modal */}
      {showRunpodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <h3 className="font-semibold text-surface-900 dark:text-surface-100">RunPod API Key</h3>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-surface-500 dark:text-surface-400 mb-3">
                Enter your RunPod API key to launch GPU pods.
              </p>
              <input
                type="password"
                value={runpodKey}
                onChange={(e) => setRunpodKey(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 mb-3"
                placeholder="rp_..."
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setShowRunpodModal(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" onClick={handleSaveRunpodKey} disabled={setRunPodKey.isPending}>
                  Save Key
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
