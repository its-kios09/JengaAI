import type { TrainingJob, TrainingLogEntry, TrainingConfigSummary } from '@/types/index.ts';
import { delay, mockTrainingJobs, mockTrainingLogs, mockTrainingConfig } from '@/lib/mock-data.ts';

export async function fetchTrainingJobs(): Promise<TrainingJob[]> {
  await delay(400);
  return mockTrainingJobs;
}

export async function fetchTrainingJob(id: string): Promise<TrainingJob> {
  await delay(300);
  const job = mockTrainingJobs.find((j) => j.id === id);
  if (!job) throw new Error('Training job not found');
  return job;
}

export async function fetchTrainingLogs(jobId: string): Promise<TrainingLogEntry[]> {
  await delay(200);
  void jobId;
  return mockTrainingLogs;
}

export async function fetchTrainingConfig(jobId: string): Promise<TrainingConfigSummary> {
  await delay(200);
  void jobId;
  return mockTrainingConfig;
}

export async function startTraining(projectId: string): Promise<TrainingJob> {
  await delay(800);
  return {
    id: `job_${Date.now()}`,
    projectId,
    projectName: 'New Training Job',
    status: 'queued',
    progress: 0,
    currentEpoch: 0,
    totalEpochs: 5,
    startedAt: new Date().toISOString(),
    metrics: { trainLoss: [], valLoss: [], accuracy: [], f1Score: [], learningRate: [], epochTimestamps: [] },
  };
}

export async function stopTraining(jobId: string): Promise<void> {
  await delay(400);
  console.log('Stopped training job:', jobId);
}
