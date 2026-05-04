import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Project, PaginatedResponse } from '@/lib/types';

export function useProjects(page = 1, filters?: { status?: string; search?: string; tag_id?: number }) {
  const params = new URLSearchParams({ page: String(page), expand: 'formula,tags' });
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.tag_id) params.set('tag_id', String(filters.tag_id));

  return useQuery({
    queryKey: ['projects', page, filters],
    queryFn: () => apiFetch<PaginatedResponse<Project>>(`/projects?${params}`),
  });
}

export function useProject(id: number) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => apiFetch<Project>(`/projects/${id}?expand=formula,tags`),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useCreateProjectFromFormula() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { formula_id: number; title: string; description?: string }) =>
      apiFetch<Project>('/projects/from-formula', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiFetch<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['projects', id] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}
