import { createEntityHooks } from './createEntityHooks';
import type { Supply } from '@/lib/types';

const hooks = createEntityHooks<Supply>({
  entityKey: 'supplies',
  basePath: '/supplies',
  listExpand: 'tags',
  detailExpand: 'tags',
});

export const useSupplies = hooks.useList;
export const useSupply = hooks.useDetail;
export const useCreateSupply = hooks.useCreate;
export const useUpdateSupply = hooks.useUpdate;
export const useDeleteSupply = hooks.useDelete;
