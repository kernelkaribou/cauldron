import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export const noteEntityTypes = ['project', 'craft', 'technique', 'material', 'curiosity'] as const;
export type NoteEntityType = (typeof noteEntityTypes)[number];

export const photoEntityTypes = ['project', 'craft', 'technique', 'material', 'curiosity', 'log'] as const;
export type PhotoEntityType = (typeof photoEntityTypes)[number];

type OwnedEntityType = NoteEntityType | PhotoEntityType;

type EntityConfig = {
  table: string;
  label: string;
};

const entityConfigs: Record<OwnedEntityType, EntityConfig> = {
  project: { table: 'projects', label: 'Project' },
  craft: { table: 'crafts', label: 'Craft' },
  technique: { table: 'techniques', label: 'Technique' },
  material: { table: 'materials', label: 'Material' },
  curiosity: { table: 'curiosities', label: 'Curiosity' },
  log: { table: 'logs', label: 'Log' },
};

export function assertOwned(
  db: Database.Database,
  table: string,
  id: number | string | bigint,
  owner: number
): boolean {
  return !!db.prepare(`SELECT id FROM ${table} WHERE id = ? AND owner_id = ?`).get(id, owner);
}

export function getOwnedEntity(
  db: Database.Database,
  entityType: OwnedEntityType,
  entityId: number,
  owner: number
): unknown {
  const config = entityConfigs[entityType];
  return db.prepare(`SELECT id FROM ${config.table} WHERE id = ? AND owner_id = ?`).get(entityId, owner);
}

export function getOwnedEntityNotFoundMessage(entityType: OwnedEntityType): string {
  return `${entityConfigs[entityType].label} not found`;
}

export function dataDir(): string {
  return process.env.DATA_DIR || '/data';
}

export function removePhotoFiles(photoId: number): void {
  const photoDir = path.join(dataDir(), 'uploads', 'photos', String(photoId));
  if (fs.existsSync(photoDir)) {
    fs.rmSync(photoDir, { recursive: true });
  }
}

export function deletePhotosForEntity(
  db: Database.Database,
  owner: number,
  entityType: PhotoEntityType,
  entityId: number
): void {
  const photos = db.prepare(
    'SELECT id FROM photos WHERE owner_id = ? AND entity_type = ? AND entity_id = ?'
  ).all(owner, entityType, entityId) as Array<{ id: number }>;

  db.prepare('DELETE FROM photos WHERE owner_id = ? AND entity_type = ? AND entity_id = ?')
    .run(owner, entityType, entityId);

  for (const photo of photos) {
    removePhotoFiles(photo.id);
  }
}

export function deleteNotesForEntity(
  db: Database.Database,
  owner: number,
  entityType: NoteEntityType,
  entityId: number
): void {
  db.prepare('DELETE FROM notes WHERE owner_id = ? AND entity_type = ? AND entity_id = ?')
    .run(owner, entityType, entityId);
}
