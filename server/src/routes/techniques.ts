import { z } from 'zod';
import { createCrudRouter } from './crud.js';

const createSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional(),
  craft_id: z.number().int().positive().nullable().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  craft_id: z.number().int().positive().nullable().optional(),
});

const router = createCrudRouter({
  table: 'techniques',
  searchColumns: ['title', 'content'],
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
      query: 'SELECT t.id, t.name FROM tags t JOIN technique_tags tt ON t.id = tt.tag_id WHERE tt.technique_id = ?',
      key: 'id',
    },
  },
});

export default router;
