import { z } from 'zod';
import { createCrudRouter } from './crud.js';

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['gathering', 'brewing', 'bottled', 'spilled']).optional(),
  recipe_id: z.number().int().positive().nullable().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['gathering', 'brewing', 'bottled', 'spilled']).optional(),
});

const router = createCrudRouter({
  table: 'brews',
  searchColumns: ['title', 'description'],
  filterColumns: ['status', 'recipe_id'],
  sortColumns: ['title', 'created_at', 'updated_at', 'status'],
  createSchema,
  updateSchema,
  expandConfig: {
    recipe: {
      type: 'one',
      query: 'SELECT id, title FROM recipes WHERE id = ?',
      key: 'recipe_id',
    },
    tags: {
      type: 'many',
      query: 'SELECT t.id, t.name FROM tags t JOIN brew_tags bt ON t.id = bt.tag_id WHERE bt.brew_id = ?',
      key: 'id',
    },
  },
});

export default router;
