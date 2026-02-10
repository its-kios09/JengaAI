import type { Project, ProjectCreateRequest } from '@/types/index.ts';
import { delay, mockProjects } from '@/lib/mock-data.ts';

export async function fetchProjects(): Promise<Project[]> {
  await delay(400);
  return mockProjects;
}

export async function fetchProject(id: string): Promise<Project> {
  await delay(300);
  const project = mockProjects.find((p) => p.id === id);
  if (!project) throw new Error('Project not found');
  return project;
}

export async function createProject(data: ProjectCreateRequest): Promise<Project> {
  await delay(600);
  return {
    id: `proj_${Date.now()}`,
    name: data.name,
    description: data.description,
    taskType: data.taskType,
    status: 'draft',
    modelName: data.modelName,
    datasetId: data.datasetId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function deleteProject(id: string): Promise<void> {
  await delay(400);
  console.log('Deleted project:', id);
}
