import { z } from 'zod';
import { createCrudRouter } from './crud.js';

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'complete', 'archived']).optional(),
  craft_id: z.number().int().positive().nullable().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'complete', 'archived']).optional(),
  craft_id: z.number().int().positive().nullable().optional(),
});

const router = createCrudRouter({
  table: 'projects',
  searchColumns: ['title', 'description'],
  filterColumns: ['status', 'craft_id'],
  sortColumns: ['title', 'created_at', 'updated_at', 'status'],
  createSchema,
  updateSchema,
  expandConfig: {
    craft: {
      type: 'one',
      query: 'SELECT id, title FROM crafts WHERE id = ?',
      key: 'craft_id',
    },
    tags: {
      type: 'many',
      query: "SELECT t.id, t.name FROM tags t JOIN entity_tags et ON t.id = et.tag_id WHERE et.entity_type = 'project' AND et.entity_id = ?",
      key: 'id',
    },
  },
});

export default router;
