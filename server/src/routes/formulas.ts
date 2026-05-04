import { z } from 'zod';
import { createCrudRouter } from './crud.js';

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  craft_id: z.number().int().positive().nullable().optional(),
  duration_minutes: z.number().int().min(0).optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  craft_id: z.number().int().positive().nullable().optional(),
  duration_minutes: z.number().int().min(0).optional(),
});

const router = createCrudRouter({
  table: 'formulas',
  searchColumns: ['title', 'description'],
  filterColumns: ['craft_id'],
  sortColumns: ['title', 'created_at', 'updated_at'],
  createSchema,
  updateSchema,
  expandConfig: {
    craft: {
      type: 'one',
      query: 'SELECT id, name FROM crafts WHERE id = ?',
      key: 'craft_id',
    },
    tags: {
      type: 'many',
      query: 'SELECT t.id, t.name FROM tags t JOIN formula_tags ft ON t.id = ft.tag_id WHERE ft.formula_id = ?',
      key: 'id',
    },
  },
});

export default router;
