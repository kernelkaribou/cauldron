import Database from 'better-sqlite3';
import { Router, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { getDb } from '../db.js';
import { ownerId } from '../middleware/owner.js';
import { validate } from '../middleware/validate.js';
import { assertOwned } from './entity-utils.js';

export interface JunctionRouteConfig {
  parentTable: string;
  parentLabel: string;
  childTable: string;
  childLabel: string;
  childIdField: string;
  junctionTable: string;
  parentFk: string;
  childFk: string;
  listQuery: string;
  addSchema: ZodSchema;
  addColumns: string[];
  addValues: (body: any) => any[];
  conflictError: string;
  successMessage: string;
  minItems?: number;
  minItemsError?: string;
}

interface ParentConfig {
  table: string;
  label: string;
  param?: string;
}

interface OwnershipRefConfig {
  table: string;
  label: string;
  source: 'body' | 'params' | 'query';
  key: string;
}

interface ListConfig {
  query: string | ((req: Request, owner: number) => { sql: string; params: any[] });
  params?: (req: Request, owner: number) => any[];
}

interface CreateConfig {
  schema: ZodSchema;
  ownershipRefs?: OwnershipRefConfig[];
  insertSql: string;
  insertParams: (req: Request, owner: number) => any[];
  selectSql: string;
  selectParams?: (id: number | string | bigint, req: Request, owner: number) => any[];
}

interface UpdateConfig {
  schema: ZodSchema;
  existingSql: string;
  existingParams: (req: Request, owner: number) => any[];
  notFoundError: string;
  ownershipRefs?: OwnershipRefConfig[];
  fields?: (body: any) => Array<[string, unknown]>;
  mapValue?: (value: unknown) => unknown;
  updateSql: (setClause: string) => string;
  updateParams: (values: any[], req: Request, owner: number) => any[];
  selectSql: string;
  selectParams?: (req: Request, owner: number) => any[];
  noFieldsError?: string;
}

interface DeleteConfig {
  existingSql?: string;
  existingParams?: (req: Request, owner: number) => any[];
  notFoundError?: string;
  beforeDelete?: (db: Database.Database, req: Request, owner: number) => void;
  deleteSql: string;
  deleteParams: (req: Request, owner: number) => any[];
}

export interface OwnedCrudSubRouteConfig {
  parent?: ParentConfig;
  itemIdParam?: string;
  list: ListConfig;
  create?: CreateConfig;
  update?: UpdateConfig;
  delete?: DeleteConfig;
}

function ensureParent(
  db: Database.Database,
  req: Request,
  res: Response,
  owner: number,
  parent?: ParentConfig
): boolean {
  if (!parent) return true;

  const parentId = req.params[parent.param ?? 'id'];
  if (typeof parentId === 'string' && assertOwned(db, parent.table, parentId, owner)) {
    return true;
  }

  res.status(404).json({ error: `${parent.label} not found` });
  return false;
}

function getRefValue(req: Request, ref: OwnershipRefConfig): unknown {
  if (ref.source === 'body') {
    return req.body[ref.key];
  }
  if (ref.source === 'query') {
    return req.query[ref.key];
  }
  return req.params[ref.key];
}

function ensureOwnershipRefs(
  db: Database.Database,
  req: Request,
  res: Response,
  owner: number,
  refs?: OwnershipRefConfig[]
): boolean {
  if (!refs) return true;

  for (const ref of refs) {
    const value = getRefValue(req, ref);
    if (value === undefined || value === null) continue;

    if (!assertOwned(db, ref.table, value as string | number, owner)) {
      res.status(404).json({ error: `${ref.label} not found` });
      return false;
    }
  }

  return true;
}

function defaultFields(body: any): Array<[string, unknown]> {
  return Object.entries(body).filter(([, value]) => value !== undefined);
}

export function createJunctionRoutes(
  router: Router,
  basePath: string,
  config: JunctionRouteConfig
): void {
  router.get(basePath, (req: Request, res: Response) => {
    const db = getDb();
    const owner = ownerId(req);
    if (!ensureParent(db, req, res, owner, { table: config.parentTable, label: config.parentLabel })) return;

    const items = db.prepare(config.listQuery).all(req.params.id);
    res.json({ items });
  });

  router.post(basePath, validate(config.addSchema), (req: Request, res: Response) => {
    const db = getDb();
    const owner = ownerId(req);
    if (!ensureParent(db, req, res, owner, { table: config.parentTable, label: config.parentLabel })) return;

    const childId = req.body[config.childIdField];
    if (!assertOwned(db, config.childTable, childId, owner)) {
      res.status(404).json({ error: `${config.childLabel} not found` });
      return;
    }

    const columns = [config.parentFk, ...config.addColumns];
    const placeholders = columns.map(() => '?').join(', ');

    try {
      db.prepare(
        `INSERT INTO ${config.junctionTable} (${columns.join(', ')}) VALUES (${placeholders})`
      ).run(req.params.id, ...config.addValues(req.body));
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.includes('UNIQUE') || msg.includes('constraint')) {
        res.status(409).json({ error: config.conflictError });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
      return;
    }

    res.status(201).json({ message: config.successMessage });
  });

  router.delete(`${basePath}/:childId`, (req: Request, res: Response) => {
    const db = getDb();
    const owner = ownerId(req);
    if (!ensureParent(db, req, res, owner, { table: config.parentTable, label: config.parentLabel })) return;

    if (config.minItems !== undefined) {
      const existing = db.prepare(
        `SELECT 1 FROM ${config.junctionTable} WHERE ${config.parentFk} = ? AND ${config.childFk} = ?`
      ).get(req.params.id, req.params.childId);
      if (!existing) {
        res.status(204).send();
        return;
      }

      const { total } = db.prepare(
        `SELECT COUNT(*) as total FROM ${config.junctionTable} WHERE ${config.parentFk} = ?`
      ).get(req.params.id) as { total: number };
      if (total <= config.minItems) {
        res.status(400).json({ error: config.minItemsError ?? 'Cannot remove required item' });
        return;
      }
    }

    db.prepare(`DELETE FROM ${config.junctionTable} WHERE ${config.parentFk} = ? AND ${config.childFk} = ?`)
      .run(req.params.id, req.params.childId);
    res.status(204).send();
  });
}

export function createOwnedCrudSubRoutes(
  router: Router,
  basePath: string,
  config: OwnedCrudSubRouteConfig
): void {
  const itemIdParam = config.itemIdParam ?? 'id';
  const itemPath = `${basePath}/:${itemIdParam}`;

  router.get(basePath, (req: Request, res: Response) => {
    const db = getDb();
    const owner = ownerId(req);
    if (!ensureParent(db, req, res, owner, config.parent)) return;

    const listConfig = typeof config.list.query === 'string'
      ? { sql: config.list.query, params: config.list.params ? config.list.params(req, owner) : [] }
      : config.list.query(req, owner);

    res.json({ items: db.prepare(listConfig.sql).all(...listConfig.params) });
  });

  if (config.create) {
    router.post(basePath, validate(config.create.schema), (req: Request, res: Response) => {
      const db = getDb();
      const owner = ownerId(req);
      if (!ensureParent(db, req, res, owner, config.parent)) return;
      if (!ensureOwnershipRefs(db, req, res, owner, config.create!.ownershipRefs)) return;

      const result = db.prepare(config.create!.insertSql).run(...config.create!.insertParams(req, owner));
      const created = db.prepare(config.create!.selectSql).get(
        ...(config.create!.selectParams ? config.create!.selectParams(result.lastInsertRowid, req, owner) : [result.lastInsertRowid])
      );
      res.status(201).json(created);
    });
  }

  if (config.update) {
    router.put(itemPath, validate(config.update.schema), (req: Request, res: Response) => {
      const db = getDb();
      const owner = ownerId(req);
      if (!ensureParent(db, req, res, owner, config.parent)) return;

      const existing = db.prepare(config.update!.existingSql).get(...config.update!.existingParams(req, owner));
      if (!existing) {
        res.status(404).json({ error: config.update!.notFoundError });
        return;
      }
      if (!ensureOwnershipRefs(db, req, res, owner, config.update!.ownershipRefs)) return;

      const fields = (config.update!.fields ?? defaultFields)(req.body);
      if (fields.length === 0) {
        res.status(400).json({ error: config.update!.noFieldsError ?? 'No fields to update' });
        return;
      }

      const values = fields.map(([, value]) => config.update!.mapValue ? config.update!.mapValue(value) : value);
      const setClause = fields.map(([key]) => `${key} = ?`).join(', ');
      db.prepare(config.update!.updateSql(setClause)).run(...config.update!.updateParams(values, req, owner));

      const updated = db.prepare(config.update!.selectSql).get(
        ...(config.update!.selectParams ? config.update!.selectParams(req, owner) : [req.params[itemIdParam]])
      );
      res.json(updated);
    });
  }

  if (config.delete) {
    router.delete(itemPath, (req: Request, res: Response) => {
      const db = getDb();
      const owner = ownerId(req);
      if (!ensureParent(db, req, res, owner, config.parent)) return;

      if (config.delete!.existingSql && config.delete!.existingParams) {
        const existing = db.prepare(config.delete!.existingSql).get(...config.delete!.existingParams(req, owner));
        if (!existing) {
          if (config.delete!.notFoundError) {
            res.status(404).json({ error: config.delete!.notFoundError });
            return;
          }
          res.status(204).send();
          return;
        }
      }

      config.delete!.beforeDelete?.(db, req, owner);

      const result = db.prepare(config.delete!.deleteSql).run(...config.delete!.deleteParams(req, owner));
      if (result.changes === 0 && config.delete!.notFoundError) {
        res.status(404).json({ error: config.delete!.notFoundError });
        return;
      }

      res.status(204).send();
    });
  }
}
