import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Log, Task, JournalEntry, SpellResource, StockEntry, StockSummary } from '@/lib/types';

// --- Logs ---
export function useLogs(params: { recipe_id?: number; brew_id?: number }) {
  const qs = new URLSearchParams();
  if (params.recipe_id) qs.set('recipe_id', String(params.recipe_id));
  if (params.brew_id) qs.set('brew_id', String(params.brew_id));
  return useQuery({
    queryKey: ['logs', params],
    queryFn: () => apiFetch<{ items: Log[] }>(`/logs?${qs}`),
  });
}

export function useCreateLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch<Log>('/logs', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logs'] }),
  });
}

export function useDeleteLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/logs/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logs'] }),
  });
}

// --- Tasks ---
export function useTasks(params: { recipe_id?: number; brew_id?: number }) {
  const qs = new URLSearchParams();
  if (params.recipe_id) qs.set('recipe_id', String(params.recipe_id));
  if (params.brew_id) qs.set('brew_id', String(params.brew_id));
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => apiFetch<{ items: Task[] }>(`/tasks?${qs}`),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiFetch<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

// --- Journal Entries ---
export function useJournalEntries(params: { recipe_id?: number; brew_id?: number }) {
  const qs = new URLSearchParams();
  if (params.recipe_id) qs.set('recipe_id', String(params.recipe_id));
  if (params.brew_id) qs.set('brew_id', String(params.brew_id));
  return useQuery({
    queryKey: ['journal-entries', params],
    queryFn: () => apiFetch<{ items: JournalEntry[] }>(`/journal-entries?${qs}`),
  });
}

export function useCreateJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch<JournalEntry>('/journal-entries', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journal-entries'] }),
  });
}

export function useUpdateJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiFetch<JournalEntry>(`/journal-entries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journal-entries'] }),
  });
}

export function useDeleteJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/journal-entries/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journal-entries'] }),
  });
}

// --- Spell Resources ---
export function useSpellResources(spellId: number) {
  return useQuery({
    queryKey: ['spell-resources', spellId],
    queryFn: () => apiFetch<{ items: SpellResource[] }>(`/spells/${spellId}/resources`),
    enabled: !!spellId,
  });
}

export function useAddSpellResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ spellId, data }: { spellId: number; data: Record<string, unknown> }) =>
      apiFetch<SpellResource>(`/spells/${spellId}/resources`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, { spellId }) => qc.invalidateQueries({ queryKey: ['spell-resources', spellId] }),
  });
}

export function useDeleteSpellResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ spellId, resourceId }: { spellId: number; resourceId: number }) =>
      apiFetch(`/spells/${spellId}/resources/${resourceId}`, { method: 'DELETE' }),
    onSuccess: (_, { spellId }) => qc.invalidateQueries({ queryKey: ['spell-resources', spellId] }),
  });
}

// --- Recipe/Brew Spells ---
export function useEntitySpells(entityType: 'recipes' | 'brews', entityId: number) {
  return useQuery({
    queryKey: [entityType, entityId, 'spells'],
    queryFn: () => apiFetch<{ items: Array<{ id: number; spell_id: number; sort_order: number; notes: string | null; title: string; content: string | null }> }>(`/${entityType}/${entityId}/spells`),
    enabled: !!entityId,
  });
}

export function useAddEntitySpell() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entityType, entityId, data }: { entityType: 'recipes' | 'brews'; entityId: number; data: Record<string, unknown> }) =>
      apiFetch(`/${entityType}/${entityId}/spells`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, { entityType, entityId }) => qc.invalidateQueries({ queryKey: [entityType, entityId, 'spells'] }),
  });
}

export function useRemoveEntitySpell() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entityType, entityId, spellId }: { entityType: 'recipes' | 'brews'; entityId: number; spellId: number }) =>
      apiFetch(`/${entityType}/${entityId}/spells/${spellId}`, { method: 'DELETE' }),
    onSuccess: (_, { entityType, entityId }) => qc.invalidateQueries({ queryKey: [entityType, entityId, 'spells'] }),
  });
}

// --- Recipe/Brew Ingredients ---
export function useEntityIngredients(entityType: 'recipes' | 'brews', entityId: number) {
  return useQuery({
    queryKey: [entityType, entityId, 'ingredients'],
    queryFn: () => apiFetch<{ items: Array<{ id: number; ingredient_id: number; quantity: number; unit: string | null; notes: string | null; name: string }> }>(`/${entityType}/${entityId}/ingredients`),
    enabled: !!entityId,
  });
}

export function useAddEntityIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entityType, entityId, data }: { entityType: 'recipes' | 'brews'; entityId: number; data: Record<string, unknown> }) =>
      apiFetch(`/${entityType}/${entityId}/ingredients`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, { entityType, entityId }) => qc.invalidateQueries({ queryKey: [entityType, entityId, 'ingredients'] }),
  });
}

export function useRemoveEntityIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entityType, entityId, ingredientId }: { entityType: 'recipes' | 'brews'; entityId: number; ingredientId: number }) =>
      apiFetch(`/${entityType}/${entityId}/ingredients/${ingredientId}`, { method: 'DELETE' }),
    onSuccess: (_, { entityType, entityId }) => qc.invalidateQueries({ queryKey: [entityType, entityId, 'ingredients'] }),
  });
}

// --- Ingredient Stock ---
export function useStock(ingredientId: number) {
  return useQuery({
    queryKey: ['stock', ingredientId],
    queryFn: () => apiFetch<{ items: StockEntry[] }>(`/ingredients/${ingredientId}/stock`),
    enabled: !!ingredientId,
  });
}

export function useStockSummary(ingredientId: number) {
  return useQuery({
    queryKey: ['stock-summary', ingredientId],
    queryFn: () => apiFetch<StockSummary>(`/ingredients/${ingredientId}/stock-summary`),
    enabled: !!ingredientId,
  });
}

export function useAddStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ingredientId, data }: { ingredientId: number; data: Record<string, unknown> }) =>
      apiFetch<StockEntry>(`/ingredients/${ingredientId}/stock`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, { ingredientId }) => {
      qc.invalidateQueries({ queryKey: ['stock', ingredientId] });
      qc.invalidateQueries({ queryKey: ['stock-summary', ingredientId] });
    },
  });
}

// --- Photos ---
export function usePhotos(params: { recipe_id?: number; brew_id?: number }) {
  const qs = new URLSearchParams();
  if (params.recipe_id) qs.set('recipe_id', String(params.recipe_id));
  if (params.brew_id) qs.set('brew_id', String(params.brew_id));
  return useQuery({
    queryKey: ['photos', params],
    queryFn: () => apiFetch<{ items: Array<{ id: number; image: string; thumbnail?: string; caption: string | null; sort_order: number; created_at: string }> }>(`/photos?${qs}`),
  });
}

export function useUploadPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/photos', { method: 'POST', body: formData, credentials: 'include' });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['photos'] }),
  });
}

export function useDeletePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/photos/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['photos'] }),
  });
}
