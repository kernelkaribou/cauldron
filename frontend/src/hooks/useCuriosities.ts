import { createEntityHooks } from './createEntityHooks';
import type { Curiosity } from '@/lib/types';

const hooks = createEntityHooks<Curiosity>({
  entityKey: 'curiosities',
  basePath: '/curiosities',
  listExpand: 'category,tags',
  detailExpand: 'category,tags',
});

export const useCuriosities = hooks.useList;
export const useCuriosity = hooks.useDetail;
export const useCreateCuriosity = hooks.useCreate;
export const useUpdateCuriosity = hooks.useUpdate;
export const useDeleteCuriosity = hooks.useDelete;
