import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Recipe, PaginatedResponse } from '@/lib/types';

export function useRecipes(page = 1, filters?: { craft_id?: number; search?: string; tag_id?: number }) {
  const params = new URLSearchParams({ page: String(page), expand: 'craft,tags' });
  if (filters?.craft_id) params.set('craft_id', String(filters.craft_id));
  if (filters?.search) params.set('search', filters.search);
  if (filters?.tag_id) params.set('tag_id', String(filters.tag_id));

  return useQuery({
    queryKey: ['recipes', page, filters],
    queryFn: () => apiFetch<PaginatedResponse<Recipe>>(`/recipes?${params}`),
  });
}

export function useRecipe(id: number) {
  return useQuery({
    queryKey: ['recipes', id],
    queryFn: () => apiFetch<Recipe>(`/recipes/${id}?expand=craft,tags`),
    enabled: !!id,
  });
}

export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch<Recipe>('/recipes', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  });
}

export function useUpdateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiFetch<Recipe>(`/recipes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['recipes'] });
      qc.invalidateQueries({ queryKey: ['recipes', id] });
    },
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/recipes/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  });
}
