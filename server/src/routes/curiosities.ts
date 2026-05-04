import { z } from 'zod';
import { createCrudRouter } from './crud.js';

const createSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url(),
  description: z.string().optional(),
  type: z.enum(['link', 'video', 'image', 'article']).optional(),
  craft_id: z.number().int().positive().nullable().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  url: z.string().url().optional(),
  description: z.string().optional(),
  type: z.enum(['link', 'video', 'image', 'article']).optional(),
  craft_id: z.number().int().positive().nullable().optional(),
});

const router = createCrudRouter({
  table: 'curiosities',
  searchColumns: ['title', 'description', 'url'],
  filterColumns: ['type', 'craft_id'],
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
      query: 'SELECT t.id, t.name FROM tags t JOIN curiosity_tags ct ON t.id = ct.tag_id WHERE ct.curiosity_id = ?',
      key: 'id',
    },
  },
});

export default router;
