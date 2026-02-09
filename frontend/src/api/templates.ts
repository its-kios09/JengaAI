import type { Template } from '@/types/index.ts';
import { delay, mockTemplates } from '@/lib/mock-data.ts';

export async function fetchTemplates(): Promise<Template[]> {
  await delay(400);
  return mockTemplates;
}

export async function fetchTemplate(id: string): Promise<Template> {
  await delay(300);
  const template = mockTemplates.find((t) => t.id === id);
  if (!template) throw new Error('Template not found');
  return template;
}
