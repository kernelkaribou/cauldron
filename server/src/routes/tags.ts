import { z } from 'zod';
import { createCrudRouter } from './crud.js';

const createSchema = z.object({
  name: z.string().min(1).max(100),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100),
});

export default createCrudRouter({
  table: 'tags',
  searchColumns: ['name'],
  sortColumns: ['name', 'created_at'],
  createSchema,
  updateSchema,
});
