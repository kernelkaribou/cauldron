import { Router, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { getDb } from '../db.js';
import { ownerId } from '../middleware/owner.js';
import { validate } from '../middleware/validate.js';

interface CrudOptions {
  table: string;
  searchColumns?: string[];
  filterColumns?: string[];
  sortColumns?: string[];
  defaultSort?: string;
  expandConfig?: Record<string, ExpandDef>;
  createSchema: ZodSchema;
  updateSchema: ZodSchema;
  beforeDelete?: (db: ReturnType<typeof getDb>, id: number, ownerId: number) => string | null;
  beforeSave?: (db: ReturnType<typeof getDb>, data: Record<string, any>, ownerId: number, existing?: Record<string, any>) => string | null;
}

interface ExpandDef {
  type: 'one' | 'many';
  query: string;
  key: string;
}

const tagEntityTypeByTable: Partial<Record<string, string>> = {
  crafts: 'craft',
  techniques: 'technique',
  projects: 'project',
  supplies: 'supply',
  curiosities: 'curiosity',
};

function buildListQuery(
  table: string,
  req: Request,
  options: CrudOptions
): { sql: string; countSql: string; params: any[] } {
  const owner = ownerId(req);
  const conditions: string[] = [`${table}.owner_id = ?`];
  const params: any[] = [owner];

  // Filters
  if (options.filterColumns) {
    for (const col of options.filterColumns) {
      const val = req.query[col];
      if (val !== undefined) {
        conditions.push(`${table}.${col} = ?`);
        params.push(val);
      }
    }
  }

  // Search
  const search = req.query.search as string | undefined;
  if (search && options.searchColumns?.length) {
    const searchConds = options.searchColumns.map(c => `${table}.${c} LIKE ?`);
    conditions.push(`(${searchConds.join(' OR ')})`);
    for (let i = 0; i < options.searchColumns.length; i++) {
      params.push(`%${search}%`);
    }
  }

  const tagId = req.query.tag_id;
  const tagEntityType = tagEntityTypeByTable[table];
  if (tagId && tagEntityType) {
    conditions.push(`${table}.id IN (SELECT entity_id FROM entity_tags WHERE entity_type = ? AND tag_id = ?)`);
    params.push(tagEntityType, tagId);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Sort
  let orderBy = `${table}.created_at DESC`;
  const sortParam = req.query.sort as string | undefined;
  if (sortParam && options.sortColumns) {
    const desc = sortParam.startsWith('-');
    const col = desc ? sortParam.slice(1) : sortParam;
    if (options.sortColumns.includes(col)) {
      orderBy = `${table}.${col} ${desc ? 'DESC' : 'ASC'}`;
    }
  } else if (options.defaultSort) {
    orderBy = options.defaultSort;
  }

  // Pagination
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const perPage = Math.min(100, Math.max(1, parseInt(req.query.per_page as string) || 24));
  const offset = (page - 1) * perPage;

  const sql = `SELECT ${table}.* FROM ${table} ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
  const countSql = `SELECT COUNT(*) as total FROM ${table} ${where}`;

  return { sql, countSql, params };
}

function applyExpansions(items: any[], req: Request, options: CrudOptions): void {
  if (!options.expandConfig) return;
  const expandParam = req.query.expand as string | undefined;
  if (!expandParam) return;

  const db = getDb();
  const requested = expandParam.split(',').map(s => s.trim());

  for (const item of items) {
    for (const key of requested) {
      const def = options.expandConfig[key];
      if (!def) continue;

      if (def.type === 'one') {
        item[key] = db.prepare(def.query).get(item[def.key]) || null;
      } else {
        item[key] = db.prepare(def.query).all(item.id);
      }
    }
  }
}

export function createCrudRouter(options: CrudOptions): Router {
  const router = Router();
  const { table } = options;

  const entityType = tagEntityTypeByTable[table];

  function enrichWithCoverPhotos(db: ReturnType<typeof getDb>, items: any[], owner: number): void {
    if (!entityType || items.length === 0) return;
    const ids = items.map(i => i.id);
    const placeholders = ids.map(() => '?').join(',');
    const covers = db.prepare(
      `SELECT id, entity_id FROM photos WHERE owner_id = ? AND entity_type = ? AND entity_id IN (${placeholders}) AND is_cover = 1`
    ).all(owner, entityType, ...ids) as Array<{ id: number; entity_id: number }>;

    const coverMap = new Map(covers.map(c => [c.entity_id, c.id]));
    for (const item of items) {
      item.cover_photo_id = coverMap.get(item.id) ?? null;
    }
  }

  // List
  router.get('/', (req: Request, res: Response) => {
    const db = getDb();
    const { sql, countSql, params } = buildListQuery(table, req, options);

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(req.query.per_page as string) || 24));

    const countParams = [...params];
    const items = db.prepare(sql).all(...params, perPage, page > 0 ? (page - 1) * perPage : 0) as any[];
    const { total } = db.prepare(countSql).get(...countParams) as { total: number };

    applyExpansions(items, req, options);
    enrichWithCoverPhotos(db, items, ownerId(req));

    res.json({
      items,
      page,
      per_page: perPage,
      total_items: total,
      total_pages: Math.ceil(total / perPage),
    });
  });

  // Get one
  router.get('/:id', (req: Request, res: Response) => {
    const db = getDb();
    const owner = ownerId(req);
    const item = db.prepare(`SELECT * FROM ${table} WHERE id = ? AND owner_id = ?`)
      .get(req.params.id, owner) as any;

    if (!item) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    applyExpansions([item], req, options);
    enrichWithCoverPhotos(db, [item], owner);
    res.json(item);
  });

  // Create
  router.post('/', validate(options.createSchema), (req: Request, res: Response) => {
    const db = getDb();
    const owner = ownerId(req);
    const data = req.body;

    if (options.beforeSave) {
      const err = options.beforeSave(db, data, owner);
      if (err) { res.status(400).json({ error: err }); return; }
    }

    const columns = Object.keys(data);
    columns.push('owner_id');
    const values = Object.values(data);
    values.push(owner);

    const placeholders = columns.map(() => '?').join(', ');
    const result = db.prepare(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`
    ).run(...values);

    const item = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(result.lastInsertRowid);
    res.status(201).json(item);
  });

  // Update
  router.put('/:id', validate(options.updateSchema), (req: Request, res: Response) => {
    const db = getDb();
    const owner = ownerId(req);
    const data = req.body;

    // Verify ownership and fetch existing row for merge
    const existing = db.prepare(`SELECT * FROM ${table} WHERE id = ? AND owner_id = ?`)
      .get(req.params.id, owner) as Record<string, any> | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    if (options.beforeSave) {
      const err = options.beforeSave(db, data, owner, existing);
      if (err) { res.status(400).json({ error: err }); return; }
    }

    const columns = Object.keys(data);
    if (columns.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    columns.push('updated_at');
    const setClauses = columns.map(c => `${c} = ?`).join(', ');
    const values = [...Object.values(data), new Date().toISOString()];

    db.prepare(`UPDATE ${table} SET ${setClauses} WHERE id = ? AND owner_id = ?`)
      .run(...values, req.params.id, owner);

    const item = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    res.json(item);
  });

  // Delete
  router.delete('/:id', (req: Request, res: Response) => {
    const db = getDb();
    const owner = ownerId(req);
    const id = Number(req.params.id);
    const existing = db.prepare(`SELECT id FROM ${table} WHERE id = ? AND owner_id = ?`)
      .get(id, owner);

    if (!existing) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    if (options.beforeDelete) {
      const error = options.beforeDelete(db, id, owner);
      if (error) {
        res.status(400).json({ error });
        return;
      }
    }

    db.prepare(`DELETE FROM ${table} WHERE id = ? AND owner_id = ?`)
      .run(id, owner);

    res.status(204).send();
  });

  return router;
}
