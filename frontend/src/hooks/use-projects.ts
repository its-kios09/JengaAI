import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProjects, fetchProject, createProject, deleteProject } from '@/api/projects.ts';
import type { ProjectCreateRequest } from '@/types/index.ts';

export function useProjects() {
  return useQuery({ queryKey: ['projects'], queryFn: fetchProjects });
}

export function useProject(id: string) {
  return useQuery({ queryKey: ['projects', id], queryFn: () => fetchProject(id), enabled: !!id });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProjectCreateRequest) => createProject(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}
