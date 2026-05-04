import { z } from 'zod';
import { createCrudRouter } from './crud.js';

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  unit: z.string().max(50).optional(),
  reusable: z.number().int().min(0).max(1).optional(),
  preferred_links: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  unit: z.string().max(50).optional(),
  reusable: z.number().int().min(0).max(1).optional(),
  preferred_links: z.string().optional(),
});

const router = createCrudRouter({
  table: 'materials',
  searchColumns: ['name', 'description'],
  filterColumns: ['reusable'],
  sortColumns: ['name', 'created_at', 'updated_at'],
  createSchema,
  updateSchema,
  expandConfig: {
    tags: {
      type: 'many',
      query: 'SELECT t.id, t.name FROM tags t JOIN material_tags mt ON t.id = mt.tag_id WHERE mt.material_id = ?',
      key: 'id',
    },
  },
});

export default router;
