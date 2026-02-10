import { useQuery } from '@tanstack/react-query';
import { fetchTemplates, fetchTemplate } from '@/api/templates.ts';

export function useTemplates() {
  return useQuery({ queryKey: ['templates'], queryFn: fetchTemplates });
}

export function useTemplate(id: string) {
  return useQuery({ queryKey: ['templates', id], queryFn: () => fetchTemplate(id), enabled: !!id });
}
