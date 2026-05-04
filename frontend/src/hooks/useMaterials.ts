import { createEntityHooks } from './createEntityHooks';
import type { Material } from '@/lib/types';

const hooks = createEntityHooks<Material>({
  entityKey: 'materials',
  basePath: '/materials',
  listExpand: 'tags',
  detailExpand: 'tags',
});

export const useMaterials = hooks.useList;
export const useMaterial = hooks.useDetail;
export const useCreateMaterial = hooks.useCreate;
export const useUpdateMaterial = hooks.useUpdate;
export const useDeleteMaterial = hooks.useDelete;
