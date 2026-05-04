import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { PaginatedResponse } from '@/lib/types';

interface EntityHooksConfig {
  entityKey: string;
  basePath: string;
  listExpand?: string;
  detailExpand?: string;
}

function normalizeFilters(filters?: Record<string, string | number | undefined>): Record<string, string | number> | undefined {
  if (!filters) return undefined;
  const cleaned: Record<string, string | number> = {};
  for (const [key, val] of Object.entries(filters)) {
    if (val !== undefined && val !== '') cleaned[key] = val;
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

export function createEntityHooks<
  T,
  CreatePayload = Record<string, unknown>,
  UpdatePayload = Record<string, unknown>,
>(config: EntityHooksConfig) {
  const { entityKey, basePath, listExpand, detailExpand } = config;

  function useList(page = 1, filters?: Record<string, string | number | undefined>) {
    const normalized = normalizeFilters(filters);
    const params = new URLSearchParams({ page: String(page) });
    if (listExpand) params.set('expand', listExpand);
    if (normalized) {
      for (const [key, val] of Object.entries(normalized)) {
        params.set(key, String(val));
      }
    }

    return useQuery({
      queryKey: [entityKey, page, normalized],
      queryFn: () => apiFetch<PaginatedResponse<T>>(`${basePath}?${params}`),
    });
  }

  function useDetail(id: number) {
    const expand = detailExpand ? `?expand=${detailExpand}` : '';
    return useQuery({
      queryKey: [entityKey, id],
      queryFn: () => apiFetch<T>(`${basePath}/${id}${expand}`),
      enabled: !!id,
    });
  }

  function useCreate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (data: CreatePayload) =>
        apiFetch<T>(basePath, { method: 'POST', body: JSON.stringify(data) }),
      onSuccess: () => qc.invalidateQueries({ queryKey: [entityKey] }),
    });
  }

  function useUpdate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: number; data: UpdatePayload }) =>
        apiFetch<T>(`${basePath}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      onSuccess: (_, { id }) => {
        qc.invalidateQueries({ queryKey: [entityKey] });
        qc.invalidateQueries({ queryKey: [entityKey, id] });
      },
    });
  }

  function useDelete() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id: number) => apiFetch(`${basePath}/${id}`, { method: 'DELETE' }),
      onSuccess: (_, id) => {
        qc.invalidateQueries({ queryKey: [entityKey] });
        qc.removeQueries({ queryKey: [entityKey, id] });
      },
    });
  }

  return { useList, useDetail, useCreate, useUpdate, useDelete };
}
