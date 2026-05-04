import { z } from 'zod';
import { createCrudRouter } from './crud.js';

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  category_id: z.number().int().positive().nullable().optional(),
  duration_minutes: z.number().int().min(0).optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  category_id: z.number().int().positive().nullable().optional(),
  duration_minutes: z.number().int().min(0).optional(),
});

const router = createCrudRouter({
  table: 'crafts',
  searchColumns: ['title', 'description'],
  filterColumns: ['category_id'],
  sortColumns: ['title', 'created_at', 'updated_at'],
  createSchema,
  updateSchema,
  expandConfig: {
    category: {
      type: 'one',
      query: 'SELECT id, name FROM categories WHERE id = ?',
      key: 'category_id',
    },
    tags: {
      type: 'many',
      query: 'SELECT t.id, t.name FROM tags t JOIN craft_tags ct ON t.id = ct.tag_id WHERE ct.craft_id = ?',
      key: 'id',
    },
  },
});

export default router;
