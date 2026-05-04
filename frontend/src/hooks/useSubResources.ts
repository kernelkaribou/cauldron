import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Log, Task, Note, TechniqueResource, StockEntry, StockSummary, Photo, MaterialVendor } from '@/lib/types';

// --- Logs ---
export function useLogs(params: { craft_id?: number; project_id?: number }) {
  const qs = new URLSearchParams();
  if (params.craft_id) qs.set('craft_id', String(params.craft_id));
  if (params.project_id) qs.set('project_id', String(params.project_id));
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
export function useTasks(params: { project_id: number }) {
  const qs = new URLSearchParams({ project_id: String(params.project_id) });
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => apiFetch<{ items: Task[] }>(`/tasks?${qs}`),
    enabled: !!params.project_id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; project_id: number; notes?: string; due_date?: string }) =>
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

// --- Notes ---
export function useNotes(params: { entity_type: string; entity_id: number }) {
  const qs = new URLSearchParams({ entity_type: params.entity_type, entity_id: String(params.entity_id) });
  return useQuery({
    queryKey: ['notes', params],
    queryFn: () => apiFetch<{ items: Note[] }>(`/notes?${qs}`),
    enabled: !!params.entity_id,
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { entity_type: string; entity_id: number; title: string; content?: string }) =>
      apiFetch<Note>('/notes', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { title?: string; content?: string } }) =>
      apiFetch<Note>(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/notes/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });
}

// --- Technique Resources ---
export function useTechniqueResources(techniqueId: number) {
  return useQuery({
    queryKey: ['technique-resources', techniqueId],
    queryFn: () => apiFetch<{ items: TechniqueResource[] }>(`/techniques/${techniqueId}/resources`),
    enabled: !!techniqueId,
  });
}

export function useAddTechniqueResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ techniqueId, data }: { techniqueId: number; data: Record<string, unknown> }) =>
      apiFetch<TechniqueResource>(`/techniques/${techniqueId}/resources`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, { techniqueId }) => qc.invalidateQueries({ queryKey: ['technique-resources', techniqueId] }),
  });
}

export function useDeleteTechniqueResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ techniqueId, resourceId }: { techniqueId: number; resourceId: number }) =>
      apiFetch(`/techniques/${techniqueId}/resources/${resourceId}`, { method: 'DELETE' }),
    onSuccess: (_, { techniqueId }) => qc.invalidateQueries({ queryKey: ['technique-resources', techniqueId] }),
  });
}

// --- Craft/Project Techniques ---
export function useEntityTechniques(entityType: 'crafts' | 'projects', entityId: number) {
  return useQuery({
    queryKey: [entityType, entityId, 'techniques'],
    queryFn: () => apiFetch<{ items: Array<{ id: number; technique_id: number; sort_order: number; notes: string | null; title: string; content: string | null }> }>(`/${entityType}/${entityId}/techniques`),
    enabled: !!entityId,
  });
}

export function useAddEntityTechnique() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entityType, entityId, data }: { entityType: 'crafts' | 'projects'; entityId: number; data: Record<string, unknown> }) =>
      apiFetch(`/${entityType}/${entityId}/techniques`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, { entityType, entityId }) => {
      qc.invalidateQueries({ queryKey: [entityType, entityId] });
    },
  });
}

export function useRemoveEntityTechnique() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entityType, entityId, techniqueId }: { entityType: 'crafts' | 'projects'; entityId: number; techniqueId: number }) =>
      apiFetch(`/${entityType}/${entityId}/techniques/${techniqueId}`, { method: 'DELETE' }),
    onSuccess: (_, { entityType, entityId }) => {
      qc.invalidateQueries({ queryKey: [entityType, entityId] });
    },
  });
}

// --- Craft/Project Materials ---
export function useEntityMaterials(entityType: 'crafts' | 'projects', entityId: number) {
  return useQuery({
    queryKey: [entityType, entityId, 'materials'],
    queryFn: () => apiFetch<{ items: Array<{ id: number; material_id: number; quantity: number; unit: string | null; notes: string | null; name: string }> }>(`/${entityType}/${entityId}/materials`),
    enabled: !!entityId,
  });
}

export function useAddEntityMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entityType, entityId, data }: { entityType: 'crafts' | 'projects'; entityId: number; data: Record<string, unknown> }) =>
      apiFetch(`/${entityType}/${entityId}/materials`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, { entityType, entityId }) => {
      qc.invalidateQueries({ queryKey: [entityType, entityId] });
    },
  });
}

export function useRemoveEntityMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entityType, entityId, materialId }: { entityType: 'crafts' | 'projects'; entityId: number; materialId: number }) =>
      apiFetch(`/${entityType}/${entityId}/materials/${materialId}`, { method: 'DELETE' }),
    onSuccess: (_, { entityType, entityId }) => {
      qc.invalidateQueries({ queryKey: [entityType, entityId] });
    },
  });
}

// --- Material Stock ---
export function useStock(materialId: number) {
  return useQuery({
    queryKey: ['stock', materialId],
    queryFn: () => apiFetch<{ items: StockEntry[] }>(`/materials/${materialId}/stock`),
    enabled: !!materialId,
  });
}

export function useStockSummary(materialId: number) {
  return useQuery({
    queryKey: ['stock-summary', materialId],
    queryFn: () => apiFetch<StockSummary>(`/materials/${materialId}/stock-summary`),
    enabled: !!materialId,
  });
}

export function useAddStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ materialId, data }: { materialId: number; data: Record<string, unknown> }) =>
      apiFetch<StockEntry>(`/materials/${materialId}/stock`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, { materialId }) => {
      qc.invalidateQueries({ queryKey: ['stock', materialId] });
      qc.invalidateQueries({ queryKey: ['stock-summary', materialId] });
    },
  });
}

// --- Material Vendors ---
export function useVendors(materialId: number) {
  return useQuery({
    queryKey: ['vendors', materialId],
    queryFn: () => apiFetch<{ items: MaterialVendor[] }>(`/materials/${materialId}/vendors`),
    enabled: !!materialId,
  });
}

export function useAddVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ materialId, data }: { materialId: number; data: { name: string; url?: string; notes?: string } }) =>
      apiFetch<MaterialVendor>(`/materials/${materialId}/vendors`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, { materialId }) => qc.invalidateQueries({ queryKey: ['vendors', materialId] }),
  });
}

export function useUpdateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ materialId, vendorId, data }: { materialId: number; vendorId: number; data: { name?: string; url?: string; notes?: string } }) =>
      apiFetch<MaterialVendor>(`/materials/${materialId}/vendors/${vendorId}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: (_, { materialId }) => qc.invalidateQueries({ queryKey: ['vendors', materialId] }),
  });
}

export function useDeleteVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ materialId, vendorId }: { materialId: number; vendorId: number }) =>
      apiFetch(`/materials/${materialId}/vendors/${vendorId}`, { method: 'DELETE' }),
    onSuccess: (_, { materialId }) => qc.invalidateQueries({ queryKey: ['vendors', materialId] }),
  });
}

// --- Photos ---
export function usePhotos(params: { entity_type: string; entity_id: number }) {
  const qs = new URLSearchParams({ entity_type: params.entity_type, entity_id: String(params.entity_id) });
  return useQuery({
    queryKey: ['photos', params],
    queryFn: () => apiFetch<{ items: Photo[] }>(`/photos?${qs}`),
    enabled: !!params.entity_id,
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

export function useSetCoverPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/photos/${id}/cover`, { method: 'PUT' }),
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
