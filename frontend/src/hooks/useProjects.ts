import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { createEntityHooks } from './createEntityHooks';
import type { Project } from '@/lib/types';

const hooks = createEntityHooks<Project>({
  entityKey: 'projects',
  basePath: '/projects',
  listExpand: 'crafts,tags',
  detailExpand: 'crafts,tags',
});

export const useProjects = hooks.useList;
export const useProject = hooks.useDetail;
export const useUpdateProject = hooks.useUpdate;
export const useDeleteProject = hooks.useDelete;

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string; status?: string; due_date?: string; crafts?: Array<{ id: number; quantity?: number }> }) =>
      apiFetch<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useCreateProjectFromCraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { craft_id: number; title: string; description?: string }) =>
      apiFetch<Project>('/projects/from-craft', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useCreateProjectFromCuriosity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { curiosity_id: number; title: string; description?: string }) =>
      apiFetch<Project>('/projects/from-curiosity', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}
