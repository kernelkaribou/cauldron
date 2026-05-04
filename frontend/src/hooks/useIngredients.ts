import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Ingredient, PaginatedResponse } from '@/lib/types';

export function useIngredients(page = 1, filters?: { search?: string; reusable?: number; tag_id?: number }) {
  const params = new URLSearchParams({ page: String(page), expand: 'tags' });
  if (filters?.search) params.set('search', filters.search);
  if (filters?.reusable !== undefined) params.set('reusable', String(filters.reusable));
  if (filters?.tag_id) params.set('tag_id', String(filters.tag_id));

  return useQuery({
    queryKey: ['ingredients', page, filters],
    queryFn: () => apiFetch<PaginatedResponse<Ingredient>>(`/ingredients?${params}`),
  });
}

export function useIngredient(id: number) {
  return useQuery({
    queryKey: ['ingredients', id],
    queryFn: () => apiFetch<Ingredient>(`/ingredients/${id}?expand=tags`),
    enabled: !!id,
  });
}

export function useCreateIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch<Ingredient>('/ingredients', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients'] }),
  });
}

export function useUpdateIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiFetch<Ingredient>(`/ingredients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['ingredients'] });
      qc.invalidateQueries({ queryKey: ['ingredients', id] });
    },
  });
}

export function useDeleteIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/ingredients/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients'] }),
  });
}
