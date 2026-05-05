import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db.js';
import { ownerId } from '../middleware/owner.js';
import { validate } from '../middleware/validate.js';
import { assertOwned, deleteNotesForEntity, deletePhotosForEntity } from './entity-utils.js';

const router = Router();
const sortColumns = new Set(['title', 'created_at', 'updated_at']);
const idSchema = z.number().int().positive();
const nullableCategoryId = z.number().int().positive().nullable().optional();
const nullableText = z.string().nullable().optional();
const nullableShortText = z.string().max(50).nullable().optional();
const nullableNotes = z.string().max(1000).nullable().optional();
const reusableSchema = z.union([z.boolean(), z.number().int().min(0).max(1)]);

const craftScalarSchema = z.object({
  title: z.string().min(1).max(200),
  description: nullableText,
  category_id: nullableCategoryId,
  duration_minutes: z.number().int().min(0).optional(),
});

const techniqueSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('existing'),
    id: idSchema,
    sort_order: z.number().int().min(0).optional(),
    notes: nullableNotes,
  }),
  z.object({
    mode: z.literal('new'),
    title: z.string().min(1).max(200),
    content: nullableText,
    category_id: nullableCategoryId,
    sort_order: z.number().int().min(0).optional(),
    notes: nullableNotes,
  }),
]);

const supplySchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('existing'),
    id: idSchema,
    quantity: z.number().min(0).optional(),
    unit: nullableShortText,
    notes: nullableNotes,
  }),
  z.object({
    mode: z.literal('new'),
    name: z.string().min(1).max(200),
    description: nullableText,
    unit: nullableShortText,
    reusable: reusableSchema.optional(),
    quantity: z.number().min(0).optional(),
    unit_on_craft: nullableShortText,
    notes: nullableNotes,
  }),
]);

const createSchema = craftScalarSchema.extend({
  techniques: z.array(techniqueSchema).min(1),
  supplies: z.array(supplySchema).min(1),
});

const updateSchema = craftScalarSchema.partial().extend({
  techniques: z.array(techniqueSchema).min(1).optional(),
  supplies: z.array(supplySchema).min(1).optional(),
});

type CreateCraftInput = z.infer<typeof createSchema>;
type UpdateCraftInput = z.infer<typeof updateSchema>;
type TechniqueInput = z.infer<typeof techniqueSchema>;
type SupplyInput = z.infer<typeof supplySchema>;

class RequestError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function insertRow(table: string, data: Record<string, unknown>): number {
  const db = getDb();
  const entries = Object.entries(data).filter(([, value]) => value !== undefined);
  const columns = entries.map(([key]) => key);
  const values = entries.map(([, value]) => value);
  const placeholders = columns.map(() => '?').join(', ');
  const result = db.prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`).run(...values);
  return Number(result.lastInsertRowid);
}

function applyCraftExpansions(items: any[], requested: Set<string>): void {
  if (items.length === 0 || requested.size === 0) return;

  const db = getDb();
  const categoryStmt = db.prepare('SELECT id, name FROM categories WHERE id = ?');
  const tagStmt = db.prepare("SELECT t.id, t.name FROM tags t JOIN entity_tags et ON t.id = et.tag_id WHERE et.entity_type = 'craft' AND et.entity_id = ?");
  const techniqueStmt = db.prepare(`
    SELECT ct.technique_id, t.title, t.content, ct.sort_order, ct.notes
    FROM craft_techniques ct
    JOIN techniques t ON t.id = ct.technique_id
    WHERE ct.craft_id = ?
    ORDER BY ct.sort_order, ct.id
  `);
  const supplyStmt = db.prepare(`
    SELECT cm.supply_id, s.name, cs.quantity, cs.unit, cs.notes
    FROM craft_supplies cm
    JOIN supplies s ON m.id = cm.supply_id
    WHERE cm.craft_id = ?
    ORDER BY cm.id
  `);

  for (const item of items) {
    if (requested.has('category')) {
      item.category = item.category_id ? categoryStmt.get(item.category_id) || null : null;
    }
    if (requested.has('tags')) {
      item.tags = tagStmt.all(item.id);
    }
    if (requested.has('techniques')) {
      item.techniques = techniqueStmt.all(item.id);
    }
    if (requested.has('supplies')) {
      item.supplies = supplyStmt.all(item.id);
    }
  }
}

function buildListQuery(req: Request): { sql: string; countSql: string; params: any[]; page: number; perPage: number } {
  const owner = ownerId(req);
  const conditions: string[] = ['crafts.owner_id = ?'];
  const params: any[] = [owner];

  if (req.query.category_id !== undefined) {
    conditions.push('crafts.category_id = ?');
    params.push(req.query.category_id);
  }

  const search = req.query.search as string | undefined;
  if (search) {
    conditions.push('(crafts.title LIKE ? OR crafts.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (req.query.tag_id) {
    conditions.push("crafts.id IN (SELECT entity_id FROM entity_tags WHERE entity_type = 'craft' AND tag_id = ?)");
    params.push(req.query.tag_id);
  }

  let orderBy = 'crafts.created_at DESC';
  const sortParam = req.query.sort as string | undefined;
  const requestedOrder = typeof req.query.order === 'string' ? req.query.order.toUpperCase() : undefined;
  if (sortParam) {
    let direction = 'ASC';
    let column = sortParam;
    if (sortParam.startsWith('-')) {
      direction = 'DESC';
      column = sortParam.slice(1);
    }
    if (requestedOrder === 'ASC' || requestedOrder === 'DESC') {
      direction = requestedOrder;
    }
    if (sortColumns.has(column)) {
      orderBy = `crafts.${column} ${direction}`;
    }
  }

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const perPage = Math.min(100, Math.max(1, parseInt(req.query.per_page as string) || 24));
  const where = `WHERE ${conditions.join(' AND ')}`;

  return {
    sql: `SELECT crafts.* FROM crafts ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    countSql: `SELECT COUNT(*) as total FROM crafts ${where}`,
    params,
    page,
    perPage,
  };
}

function parseExpand(req: Request): Set<string> {
  const expand = req.query.expand as string | undefined;
  if (!expand) return new Set();
  return new Set(expand.split(',').map(part => part.trim()).filter(Boolean));
}

function ensureOwnedTechnique(id: number, owner: number): void {
  if (!assertOwned(getDb(), 'techniques', id, owner)) {
    throw new RequestError(400, 'Technique not found');
  }
}

function ensureOwnedSupply(id: number, owner: number): void {
  if (!assertOwned(getDb(), 'supplies', id, owner)) {
    throw new RequestError(400, 'Supply not found');
  }
}

function toReusableValue(value: boolean | number | undefined): number | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'boolean' ? Number(value) : value;
}

function replaceCraftTechniques(craftId: number, owner: number, techniques: TechniqueInput[]): void {
  const db = getDb();
  const insertCraftTechnique = db.prepare(
    'INSERT INTO craft_techniques (craft_id, technique_id, sort_order, notes) VALUES (?, ?, ?, ?)'
  );

  for (const technique of techniques) {
    let techniqueId = technique.mode === 'existing' ? technique.id : 0;

    if (technique.mode === 'existing') {
      ensureOwnedTechnique(technique.id, owner);
    } else {
      techniqueId = insertRow('techniques', {
        title: technique.title,
        content: technique.content,
        category_id: technique.category_id,
        owner_id: owner,
      });
    }

    try {
      insertCraftTechnique.run(craftId, techniqueId, technique.sort_order ?? 0, technique.notes ?? null);
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new RequestError(409, 'Technique already attached to this craft');
      }
      throw error;
    }
  }
}

function replaceCraftSupplies(craftId: number, owner: number, supplies: SupplyInput[]): void {
  const db = getDb();
  const insertCraftSupply = db.prepare(
    'INSERT INTO craft_supplies (craft_id, supply_id, quantity, unit, notes) VALUES (?, ?, ?, ?, ?)'
  );

  for (const supply of supplies) {
    let supplyId = supply.mode === 'existing' ? supply.id : 0;
    let unitOnCraft = supply.mode === 'existing' ? supply.unit ?? null : supply.unit_on_craft ?? null;

    if (supply.mode === 'existing') {
      ensureOwnedSupply(supply.id, owner);
    } else {
      supplyId = insertRow('supplies', {
        name: supply.name,
        description: supply.description,
        unit: supply.unit,
        reusable: toReusableValue(supply.reusable),
        owner_id: owner,
      });
    }

    try {
      insertCraftSupply.run(craftId, supplyId, supply.quantity ?? 0, unitOnCraft, supply.notes ?? null);
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new RequestError(409, 'Supply already attached to this craft');
      }
      throw error;
    }
  }
}

function ensureCraftInvariant(craftId: number): void {
  const db = getDb();
  const techniqueCount = db.prepare('SELECT COUNT(*) as total FROM craft_techniques WHERE craft_id = ?').get(craftId) as { total: number };
  const supplyCount = db.prepare('SELECT COUNT(*) as total FROM craft_supplies WHERE craft_id = ?').get(craftId) as { total: number };

  if (techniqueCount.total < 1) {
    throw new RequestError(400, 'Craft must have at least one technique');
  }
  if (supplyCount.total < 1) {
    throw new RequestError(400, 'Craft must have at least one supply');
  }
}

function handleRouteError(res: Response, error: unknown): void {
  if (error instanceof RequestError) {
    res.status(error.status).json({ error: error.message });
    return;
  }

  if (error instanceof Error && error.message.includes('FOREIGN KEY constraint failed')) {
    res.status(400).json({ error: 'Invalid foreign key reference' });
    return;
  }

  throw error;
}

router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const { sql, countSql, params, page, perPage } = buildListQuery(req);
  const items = db.prepare(sql).all(...params, perPage, (page - 1) * perPage) as any[];
  const { total } = db.prepare(countSql).get(...params) as { total: number };

  applyCraftExpansions(items, parseExpand(req));

  res.json({
    items,
    page,
    per_page: perPage,
    total_items: total,
    total_pages: Math.ceil(total / perPage),
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const craft = db.prepare('SELECT * FROM crafts WHERE id = ? AND owner_id = ?').get(req.params.id, owner) as any;

  if (!craft) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  applyCraftExpansions([craft], parseExpand(req));
  res.json(craft);
});

router.post('/', validate(createSchema), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const data = req.body as CreateCraftInput;

  try {
    const craftId = db.transaction(() => {
      const createdCraftId = insertRow('crafts', {
        title: data.title,
        description: data.description,
        category_id: data.category_id,
        duration_minutes: data.duration_minutes,
        owner_id: owner,
      });

      replaceCraftTechniques(createdCraftId, owner, data.techniques);
      replaceCraftSupplies(createdCraftId, owner, data.supplies);
      ensureCraftInvariant(createdCraftId);

      return createdCraftId;
    })();

    const craft = db.prepare('SELECT * FROM crafts WHERE id = ? AND owner_id = ?').get(craftId, owner);
    res.status(201).json(craft);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.put('/:id', validate(updateSchema), (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const craftId = Number(req.params.id);

  if (!assertOwned(db, 'crafts', craftId, owner)) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const data = req.body as UpdateCraftInput;
  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  try {
    const updatedCraft = db.transaction(() => {
      const updates: Record<string, unknown> = {};
      if ('title' in data) updates.title = data.title;
      if ('description' in data) updates.description = data.description;
      if ('category_id' in data) updates.category_id = data.category_id;
      if ('duration_minutes' in data) updates.duration_minutes = data.duration_minutes;

      const timestamp = new Date().toISOString();
      if (Object.keys(updates).length > 0) {
        const updateEntries = Object.entries({ ...updates, updated_at: timestamp });
        const setClause = updateEntries.map(([column]) => `${column} = ?`).join(', ');
        const values = updateEntries.map(([, value]) => value);
        db.prepare(`UPDATE crafts SET ${setClause} WHERE id = ? AND owner_id = ?`).run(...values, craftId, owner);
      } else {
        db.prepare('UPDATE crafts SET updated_at = ? WHERE id = ? AND owner_id = ?').run(timestamp, craftId, owner);
      }

      if (data.techniques) {
        db.prepare('DELETE FROM craft_techniques WHERE craft_id = ?').run(craftId);
        replaceCraftTechniques(craftId, owner, data.techniques);
      }

      if (data.supplies) {
        db.prepare('DELETE FROM craft_supplies WHERE craft_id = ?').run(craftId);
        replaceCraftSupplies(craftId, owner, data.supplies);
      }

      ensureCraftInvariant(craftId);
      return db.prepare('SELECT * FROM crafts WHERE id = ? AND owner_id = ?').get(craftId, owner);
    })();

    res.json(updatedCraft);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const craftId = Number(req.params.id);

  if (!assertOwned(db, 'crafts', craftId, owner)) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const logs = db.prepare('SELECT id FROM logs WHERE owner_id = ? AND craft_id = ?').all(owner, craftId) as Array<{ id: number }>;
  for (const log of logs) {
    deletePhotosForEntity(db, owner, 'log', log.id);
  }

  deletePhotosForEntity(db, owner, 'craft', craftId);
  deleteNotesForEntity(db, owner, 'craft', craftId);
  db.prepare('DELETE FROM crafts WHERE id = ? AND owner_id = ?').run(craftId, owner);

  res.status(204).send();
});

export default router;
