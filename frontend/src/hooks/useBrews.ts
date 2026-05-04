import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Brew, PaginatedResponse } from '@/lib/types';

export function useBrews(page = 1, filters?: { status?: string; search?: string; tag_id?: number }) {
  const params = new URLSearchParams({ page: String(page), expand: 'recipe,tags' });
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.tag_id) params.set('tag_id', String(filters.tag_id));

  return useQuery({
    queryKey: ['brews', page, filters],
    queryFn: () => apiFetch<PaginatedResponse<Brew>>(`/brews?${params}`),
  });
}

export function useBrew(id: number) {
  return useQuery({
    queryKey: ['brews', id],
    queryFn: () => apiFetch<Brew>(`/brews/${id}?expand=recipe,tags`),
    enabled: !!id,
  });
}

export function useCreateBrew() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch<Brew>('/brews', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brews'] }),
  });
}

export function useCreateBrewFromRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { recipe_id: number; title: string; description?: string }) =>
      apiFetch<Brew>('/brews/from-recipe', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brews'] }),
  });
}

export function useUpdateBrew() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiFetch<Brew>(`/brews/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['brews'] });
      qc.invalidateQueries({ queryKey: ['brews', id] });
    },
  });
}

export function useDeleteBrew() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/brews/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brews'] }),
  });
}
