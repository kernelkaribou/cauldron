import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ownerId } from '../middleware/owner.js';
import { validate } from '../middleware/validate.js';
import { getDb } from '../db.js';
import {
  getOwnedEntity,
  getOwnedEntityNotFoundMessage,
  noteEntityTypes,
} from './entity-utils.js';
import { createJunctionRoutes, createOwnedCrudSubRoutes } from './route-factories.js';

const addTechniqueSchema = z.object({
  technique_id: z.number().int().positive(),
  sort_order: z.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
});
const addSupplySchema = z.object({
  supply_id: z.number().int().positive(),
  quantity: z.number().min(0).optional(),
  unit: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});
const addResourceSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  type: z.enum(['video', 'article', 'other']).optional(),
});
const addStockSchema = z.object({
  type: z.enum(['purchase', 'usage', 'adjustment']),
  quantity: z.number().positive(),
  unit_cost: z.number().min(0).optional(),
  location: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  project_id: z.number().int().positive().nullable().optional(),
  date: z.string().min(1),
});
const supplyVendorSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
});
const logSchema = z.object({
  content: z.string().optional(),
  duration_minutes: z.number().int().min(0).optional(),
  links: z.string().optional(),
  date: z.string().min(1),
  craft_id: z.number().int().positive().nullable().optional(),
  project_id: z.number().int().positive().nullable().optional(),
});
const taskSchema = z.object({
  title: z.string().min(1).max(200),
  notes: z.string().max(1000).optional(),
  done: z.number().int().min(0).max(1).optional(),
  due_date: z.string().nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
  project_id: z.number().int().positive(),
});
const noteEntitySchema = z.enum(noteEntityTypes);
const noteQuerySchema = z.object({
  entity_type: noteEntitySchema,
  entity_id: z.coerce.number().int().positive(),
});
const noteSchema = z.object({
  entity_type: noteEntitySchema,
  entity_id: z.number().int().positive(),
  title: z.string().min(1).max(200),
  content: z.string().optional(),
});
const noteUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
});

export function registerStandardSubresourceRoutes(router: Router): void {
  [
    {
      basePath: '/crafts/:id/techniques',
      config: {
        parentTable: 'crafts',
        parentLabel: 'Craft',
        childTable: 'techniques',
        childLabel: 'Technique',
        childIdField: 'technique_id',
        junctionTable: 'craft_techniques',
        parentFk: 'craft_id',
        childFk: 'technique_id',
        listQuery: `
          SELECT ft.id, ft.technique_id, ft.sort_order, ft.notes, t.title, t.content
          FROM craft_techniques ft JOIN techniques t ON ft.technique_id = t.id
          WHERE ft.craft_id = ? ORDER BY ft.sort_order
        `,
        addSchema: addTechniqueSchema,
        addColumns: ['technique_id', 'sort_order', 'notes'],
        addValues: (body: any) => [body.technique_id, body.sort_order || 0, body.notes || null],
        conflictError: 'Technique already attached to this craft',
        successMessage: 'Technique added',
        minItems: 1,
        minItemsError: 'Cannot remove the last technique from a craft',
      },
    },
    {
      basePath: '/crafts/:id/supplies',
      config: {
        parentTable: 'crafts',
        parentLabel: 'Craft',
        childTable: 'supplies',
        childLabel: 'Supply',
        childIdField: 'supply_id',
        junctionTable: 'craft_supplies',
        parentFk: 'craft_id',
        childFk: 'supply_id',
        listQuery: `
          SELECT cs.id, cs.supply_id, cs.quantity, cs.unit, cs.notes, s.name
          FROM craft_supplies cs JOIN supplies s ON cs.supply_id = s.id
          WHERE cs.craft_id = ? ORDER BY cs.id
        `,
        addSchema: addSupplySchema,
        addColumns: ['supply_id', 'quantity', 'unit', 'notes'],
        addValues: (body: any) => [body.supply_id, body.quantity || 0, body.unit || null, body.notes || null],
        conflictError: 'Supply already attached to this craft',
        successMessage: 'Supply added',
        minItems: 1,
        minItemsError: 'Cannot remove the last supply from a craft',
      },
    },
    {
      basePath: '/projects/:id/techniques',
      config: {
        parentTable: 'projects',
        parentLabel: 'Project',
        childTable: 'techniques',
        childLabel: 'Technique',
        childIdField: 'technique_id',
        junctionTable: 'project_techniques',
        parentFk: 'project_id',
        childFk: 'technique_id',
        listQuery: `
          SELECT pt.id, pt.technique_id, pt.sort_order, pt.notes, t.title, t.content
          FROM project_techniques pt JOIN techniques t ON pt.technique_id = t.id
          WHERE pt.project_id = ? ORDER BY pt.sort_order
        `,
        addSchema: addTechniqueSchema,
        addColumns: ['technique_id', 'sort_order', 'notes'],
        addValues: (body: any) => [body.technique_id, body.sort_order || 0, body.notes || null],
        conflictError: 'Technique already attached to this project',
        successMessage: 'Technique added',
      },
    },
    {
      basePath: '/projects/:id/supplies',
      config: {
        parentTable: 'projects',
        parentLabel: 'Project',
        childTable: 'supplies',
        childLabel: 'Supply',
        childIdField: 'supply_id',
        junctionTable: 'project_supplies',
        parentFk: 'project_id',
        childFk: 'supply_id',
        listQuery: `
          SELECT ps.id, ps.supply_id, ps.quantity, ps.unit, ps.notes, s.name
          FROM project_supplies ps JOIN supplies s ON ps.supply_id = s.id
          WHERE ps.project_id = ? ORDER BY ps.id
        `,
        addSchema: addSupplySchema,
        addColumns: ['supply_id', 'quantity', 'unit', 'notes'],
        addValues: (body: any) => [body.supply_id, body.quantity || 0, body.unit || null, body.notes || null],
        conflictError: 'Supply already attached to this project',
        successMessage: 'Supply added',
      },
    },
  ].forEach(({ basePath, config }) => createJunctionRoutes(router, basePath, config));

  createOwnedCrudSubRoutes(router, '/techniques/:id/resources', {
    parent: { table: 'techniques', label: 'Technique' },
    itemIdParam: 'resourceId',
    list: { query: 'SELECT * FROM technique_resources WHERE technique_id = ?', params: req => [req.params.id] },
    create: {
      schema: addResourceSchema,
      insertSql: 'INSERT INTO technique_resources (technique_id, url, title, description, type) VALUES (?, ?, ?, ?, ?)',
      insertParams: req => [req.params.id, req.body.url, req.body.title, req.body.description || null, req.body.type || null],
      selectSql: 'SELECT * FROM technique_resources WHERE id = ?',
    },
    delete: {
      deleteSql: 'DELETE FROM technique_resources WHERE id = ? AND technique_id = ?',
      deleteParams: req => [req.params.resourceId, req.params.id],
    },
  });

  createOwnedCrudSubRoutes(router, '/supplies/:id/stock', {
    parent: { table: 'supplies', label: 'Supply' },
    list: {
      query: 'SELECT * FROM supply_stock WHERE supply_id = ? ORDER BY date DESC, created_at DESC',
      params: req => [req.params.id],
    },
    create: {
      schema: addStockSchema,
      ownershipRefs: [
        { table: 'projects', label: 'Project', source: 'body', key: 'project_id' },
      ],
      insertSql: `
        INSERT INTO supply_stock (supply_id, type, quantity, unit_cost, location, notes, project_id, date, owner_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      insertParams: (req, owner) => [
        req.params.id,
        req.body.type,
        req.body.quantity,
        req.body.unit_cost || 0,
        req.body.location || null,
        req.body.notes || null,
        req.body.project_id || null,
        req.body.date,
        owner,
      ],
      selectSql: 'SELECT * FROM supply_stock WHERE id = ?',
    },
  });

  createOwnedCrudSubRoutes(router, '/supplies/:id/vendors', {
    parent: { table: 'supplies', label: 'Supply' },
    itemIdParam: 'vendorId',
    list: {
      query: 'SELECT * FROM supply_vendors WHERE supply_id = ? AND owner_id = ? ORDER BY created_at DESC, id DESC',
      params: (req, owner) => [req.params.id, owner],
    },
    create: {
      schema: supplyVendorSchema,
      insertSql: 'INSERT INTO supply_vendors (supply_id, name, url, notes, owner_id) VALUES (?, ?, ?, ?, ?)',
      insertParams: (req, owner) => [req.params.id, req.body.name, req.body.url || null, req.body.notes || null, owner],
      selectSql: 'SELECT * FROM supply_vendors WHERE id = ?',
    },
    update: {
      schema: supplyVendorSchema.partial(),
      existingSql: 'SELECT id FROM supply_vendors WHERE id = ? AND supply_id = ? AND owner_id = ?',
      existingParams: (req, owner) => [req.params.vendorId, req.params.id, owner],
      notFoundError: 'Vendor not found',
      mapValue: value => value || null,
      updateSql: setClause => `UPDATE supply_vendors SET ${setClause} WHERE id = ? AND supply_id = ? AND owner_id = ?`,
      updateParams: (values, req, owner) => [...values, req.params.vendorId, req.params.id, owner],
      selectSql: 'SELECT * FROM supply_vendors WHERE id = ?',
      selectParams: req => [req.params.vendorId],
    },
    delete: {
      notFoundError: 'Vendor not found',
      deleteSql: 'DELETE FROM supply_vendors WHERE id = ? AND supply_id = ? AND owner_id = ?',
      deleteParams: (req, owner) => [req.params.vendorId, req.params.id, owner],
    },
  });

  createOwnedCrudSubRoutes(router, '/logs', {
    list: {
      query: (req, owner) => {
        const { craft_id, project_id } = req.query;
        let sql = 'SELECT * FROM logs WHERE owner_id = ?';
        const params: any[] = [owner];
        if (craft_id) { sql += ' AND craft_id = ?'; params.push(craft_id); }
        else if (project_id) { sql += ' AND project_id = ?'; params.push(project_id); }
        sql += ' ORDER BY date DESC, created_at DESC';
        return { sql, params };
      },
    },
    create: {
      schema: logSchema,
      ownershipRefs: [
        { table: 'crafts', label: 'Craft', source: 'body', key: 'craft_id' },
        { table: 'projects', label: 'Project', source: 'body', key: 'project_id' },
      ],
      insertSql: 'INSERT INTO logs (owner_id, craft_id, project_id, content, duration_minutes, links, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      insertParams: (req, owner) => [
        owner,
        req.body.craft_id || null,
        req.body.project_id || null,
        req.body.content || null,
        req.body.duration_minutes || 0,
        req.body.links ?? '[]',
        req.body.date,
      ],
      selectSql: 'SELECT * FROM logs WHERE id = ?',
    },
    update: {
      schema: logSchema.partial(),
      existingSql: 'SELECT id FROM logs WHERE id = ? AND owner_id = ?',
      existingParams: (req, owner) => [req.params.id, owner],
      notFoundError: 'Not found',
      ownershipRefs: [
        { table: 'crafts', label: 'Craft', source: 'body', key: 'craft_id' },
        { table: 'projects', label: 'Project', source: 'body', key: 'project_id' },
      ],
      updateSql: setClause => `UPDATE logs SET ${setClause} WHERE id = ?`,
      updateParams: (values, req) => [...values, req.params.id],
      selectSql: 'SELECT * FROM logs WHERE id = ?',
    },
  });

  createOwnedCrudSubRoutes(router, '/tasks', {
    list: {
      query: (req, owner) => {
        let sql = 'SELECT * FROM tasks WHERE owner_id = ?';
        const params: any[] = [owner];
        if (req.query.project_id) { sql += ' AND project_id = ?'; params.push(req.query.project_id); }
        sql += ' ORDER BY sort_order ASC, created_at ASC';
        return { sql, params };
      },
    },
    create: {
      schema: taskSchema,
      ownershipRefs: [{ table: 'projects', label: 'Project', source: 'body', key: 'project_id' }],
      insertSql: 'INSERT INTO tasks (owner_id, project_id, title, notes, done, due_date, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      insertParams: (req, owner) => [
        owner,
        req.body.project_id,
        req.body.title,
        req.body.notes || null,
        req.body.done || 0,
        req.body.due_date || null,
        req.body.sort_order || 0,
      ],
      selectSql: 'SELECT * FROM tasks WHERE id = ?',
    },
    update: {
      schema: taskSchema.partial(),
      existingSql: 'SELECT id FROM tasks WHERE id = ? AND owner_id = ?',
      existingParams: (req, owner) => [req.params.id, owner],
      notFoundError: 'Not found',
      ownershipRefs: [{ table: 'projects', label: 'Project', source: 'body', key: 'project_id' }],
      updateSql: setClause => `UPDATE tasks SET ${setClause} WHERE id = ?`,
      updateParams: (values, req) => [...values, req.params.id],
      selectSql: 'SELECT * FROM tasks WHERE id = ?',
    },
    delete: {
      notFoundError: 'Not found',
      deleteSql: 'DELETE FROM tasks WHERE id = ? AND owner_id = ?',
      deleteParams: (req, owner) => [req.params.id, owner],
    },
  });

  router.get('/notes', (req: Request, res: Response) => {
    const parsed = noteQuerySchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: 'Invalid note filters' }); return; }

    const db = getDb();
    const owner = ownerId(req);
    const { entity_type, entity_id } = parsed.data;
    const items = db.prepare(
      'SELECT * FROM notes WHERE owner_id = ? AND entity_type = ? AND entity_id = ? ORDER BY created_at DESC, id DESC'
    ).all(owner, entity_type, entity_id);
    res.json({ items });
  });

  router.post('/notes', validate(noteSchema), (req: Request, res: Response) => {
    const db = getDb();
    const owner = ownerId(req);
    const { entity_type, entity_id, title, content } = req.body;
    if (!getOwnedEntity(db, entity_type, entity_id, owner)) { res.status(404).json({ error: getOwnedEntityNotFoundMessage(entity_type) }); return; }

    const result = db.prepare(
      'INSERT INTO notes (owner_id, entity_type, entity_id, title, content) VALUES (?, ?, ?, ?, ?)'
    ).run(owner, entity_type, entity_id, title, content || null);

    res.status(201).json(db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid));
  });

  router.put('/notes/:id', validate(noteUpdateSchema), (req: Request, res: Response) => {
    const db = getDb();
    const owner = ownerId(req);
    const existing = db.prepare('SELECT id FROM notes WHERE id = ? AND owner_id = ?').get(req.params.id, owner);
    if (!existing) { res.status(404).json({ error: 'Not found' }); return; }

    const fields = Object.entries(req.body).filter(([, value]) => value !== undefined);
    if (fields.length === 0) { res.status(400).json({ error: 'No fields to update' }); return; }

    const setClauses = [...fields.map(([key]) => `${key} = ?`), 'updated_at = CURRENT_TIMESTAMP'].join(', ');
    const values = fields.map(([, value]) => value);
    db.prepare(`UPDATE notes SET ${setClauses} WHERE id = ? AND owner_id = ?`).run(...values, req.params.id, owner);

    res.json(db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id));
  });

  router.delete('/notes/:id', (req: Request, res: Response) => {
    const db = getDb();
    const owner = ownerId(req);
    const result = db.prepare('DELETE FROM notes WHERE id = ? AND owner_id = ?').run(req.params.id, owner);
    if (result.changes === 0) { res.status(404).json({ error: 'Not found' }); return; }
    res.status(204).send();
  });
}
