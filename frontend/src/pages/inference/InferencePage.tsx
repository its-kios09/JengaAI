import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader.tsx';
import { LoadingSpinner } from '@/components/common/LoadingSpinner.tsx';
import { Card, CardContent, CardHeader } from '@/components/ui/Card.tsx';
import { Select } from '@/components/ui/Select.tsx';
import { Textarea } from '@/components/ui/Textarea.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { Badge } from '@/components/ui/Badge.tsx';
import { useInferenceModels, usePredict } from '@/hooks/use-inference.ts';
import type { PredictionResponse } from '@/types/index.ts';

function ClassificationResults({ result }: { result: PredictionResponse }) {
  if (!result.classification) return null;
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-100">Classification Results</h4>
      {result.classification.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-sm text-surface-700 dark:text-surface-300 w-24 capitalize">{item.label}</span>
          <div className="flex-1 h-4 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${item.confidence * 100}%` }} />
          </div>
          <span className="text-sm font-medium text-surface-900 dark:text-surface-100 w-14 text-right">{(item.confidence * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

function NERResults({ result }: { result: PredictionResponse }) {
  if (!result.ner) return null;
  const entityColors: Record<string, string> = { PERSON: 'info', ORG: 'success', MONEY: 'warning', LOC: 'danger' };
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-100">Named Entities</h4>
      <div className="flex flex-wrap gap-2">
        {result.ner.entities.map((ent, i) => (
          <Badge key={i} variant={(entityColors[ent.label] as 'info' | 'success' | 'warning' | 'danger') || 'default'}>
            {ent.text} <span className="opacity-60 ml-1">{ent.label}</span>
          </Badge>
        ))}
      </div>
      <div className="text-sm text-surface-600 dark:text-surface-400 p-3 bg-surface-50 dark:bg-surface-900 rounded-lg">
        {result.ner.text}
      </div>
    </div>
  );
}

function SentimentResults({ result }: { result: PredictionResponse }) {
  if (!result.sentiment) return null;
  const s = result.sentiment;
  const sentColor = s.sentiment === 'positive' ? 'text-success-500' : s.sentiment === 'negative' ? 'text-danger-500' : 'text-surface-400';
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-100">Sentiment Analysis</h4>
      <div className="text-center">
        <p className={`text-3xl font-bold capitalize ${sentColor}`}>{s.sentiment}</p>
        <p className="text-sm text-surface-500 mt-1">Score: {s.score.toFixed(2)}</p>
      </div>
      <div className="space-y-2">
        {(['positive', 'negative', 'neutral'] as const).map((key) => (
          <div key={key} className="flex items-center gap-3">
            <span className="text-sm text-surface-700 dark:text-surface-300 w-20 capitalize">{key}</span>
            <div className="flex-1 h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${key === 'positive' ? 'bg-success-500' : key === 'negative' ? 'bg-danger-500' : 'bg-surface-400'}`}
                style={{ width: `${s.breakdown[key] * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-surface-600 dark:text-surface-300 w-10 text-right">
              {(s.breakdown[key] * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function InferencePage() {
  const { data: models } = useInferenceModels();
  const predictMutation = usePredict();
  const [modelId, setModelId] = useState('');
  const [text, setText] = useState('');

  const handlePredict = () => {
    if (!modelId || !text.trim()) return;
    predictMutation.mutate({ modelId, text });
  };

  return (
    <div>
      <PageHeader title="Inference" subtitle="Test your trained models with live predictions" />

      {/* Teachable Machine banner */}
      <Link
        to="/teachable"
        className="flex items-center gap-3 px-4 py-3 mb-6 rounded-xl bg-gradient-to-r from-accent-50 to-primary-50 dark:from-accent-900/20 dark:to-primary-900/20
          border border-accent-200 dark:border-accent-800 hover:shadow-md transition-shadow group"
      >
        <Sparkles size={20} className="text-accent-500 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
            Try Teachable Machine Mode
          </p>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            Train a classifier in seconds with your own text samples — no dataset needed.
          </p>
        </div>
        <span className="text-xs text-primary-600 dark:text-primary-400 font-medium group-hover:underline">
          Try it &rarr;
        </span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardContent>
              <Select
                label="Select Model"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                options={(models || []).map((m) => ({ value: m.id, label: `${m.name} (${m.taskType}) — ${(m.accuracy * 100).toFixed(1)}%` }))}
                placeholder="Choose a model..."
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Textarea
                label="Input Text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text for prediction..."
                rows={6}
              />
              <Button className="mt-4 w-full" icon={<Zap size={16} />} onClick={handlePredict} disabled={!modelId || !text.trim()} loading={predictMutation.isPending}>
                Predict
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-surface-900 dark:text-surface-100">Results</h3>
          </CardHeader>
          <CardContent>
            {predictMutation.isPending && (
              <div className="flex justify-center py-8"><LoadingSpinner size="lg" /></div>
            )}
            {predictMutation.data && !predictMutation.isPending && (
              <>
                {predictMutation.data.taskType === 'classification' && <ClassificationResults result={predictMutation.data} />}
                {predictMutation.data.taskType === 'ner' && <NERResults result={predictMutation.data} />}
                {predictMutation.data.taskType === 'sentiment' && <SentimentResults result={predictMutation.data} />}
              </>
            )}
            {!predictMutation.data && !predictMutation.isPending && (
              <p className="text-center text-surface-500 py-8">Select a model and enter text to get predictions.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
