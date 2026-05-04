import { Router, Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { getDb } from '../db.js';
import { ownerId } from '../middleware/owner.js';
import {
  dataDir,
  getOwnedEntity,
  getOwnedEntityNotFoundMessage,
  photoEntityTypes,
  removePhotoFiles,
  type PhotoEntityType,
} from './entity-utils.js';

const router = Router();
const photoEntitySchema = z.enum(photoEntityTypes);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(dataDir(), 'uploads', 'tmp');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

async function generateThumbnails(sourcePath: string, destDir: string): Promise<void> {
  fs.mkdirSync(destDir, { recursive: true });

  const sizes = [200, 400, 800];
  for (const size of sizes) {
    await sharp(sourcePath)
      .resize(size, size, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(path.join(destDir, `thumb_${size}.webp`));
  }
}

function cleanupUpload(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const { entity_type, entity_id } = req.query;

  if ((entity_type && !entity_id) || (!entity_type && entity_id)) {
    res.status(400).json({ error: 'entity_type and entity_id must be provided together' });
    return;
  }

  let sql = 'SELECT * FROM photos WHERE owner_id = ?';
  const params: any[] = [owner];

  if (entity_type && entity_id) {
    const parsed = z.object({
      entity_type: photoEntitySchema,
      entity_id: z.coerce.number().int().positive(),
    }).safeParse({ entity_type, entity_id });

    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid photo filters' });
      return;
    }

    sql += ' AND entity_type = ? AND entity_id = ?';
    params.push(parsed.data.entity_type, parsed.data.entity_id);
  }

  sql += ' ORDER BY is_cover DESC, sort_order ASC, created_at DESC';
  res.json({ items: db.prepare(sql).all(...params) });
});

router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image file provided' });
    return;
  }

  const parsed = z.object({
    entity_type: photoEntitySchema,
    entity_id: z.coerce.number().int().positive(),
    caption: z.string().optional(),
  }).safeParse(req.body);

  if (!parsed.success) {
    cleanupUpload(req.file.path);
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
    return;
  }

  const db = getDb();
  const owner = ownerId(req);
  const { entity_type, entity_id, caption } = parsed.data;

  if (!getOwnedEntity(db, entity_type, entity_id, owner)) {
    cleanupUpload(req.file.path);
    res.status(404).json({ error: getOwnedEntityNotFoundMessage(entity_type) });
    return;
  }

  const result = db.prepare(
    'INSERT INTO photos (owner_id, entity_type, entity_id, image, caption) VALUES (?, ?, ?, ?, ?)'
  ).run(owner, entity_type, entity_id, '', caption ?? null);

  const photoId = Number(result.lastInsertRowid);
  const destDir = path.join(dataDir(), 'uploads', 'photos', String(photoId));
  const ext = path.extname(req.file.originalname);
  const filename = `original${ext}`;
  const destPath = path.join(destDir, filename);
  fs.mkdirSync(destDir, { recursive: true });
  fs.renameSync(req.file.path, destPath);

  await generateThumbnails(destPath, destDir);
  db.prepare('UPDATE photos SET image = ? WHERE id = ?').run(filename, photoId);

  const photo = db.prepare('SELECT * FROM photos WHERE id = ? AND owner_id = ?').get(photoId, owner);
  res.status(201).json(photo);
});

router.put('/:id/cover', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const photo = db.prepare('SELECT * FROM photos WHERE id = ? AND owner_id = ?')
    .get(req.params.id, owner) as { id: number; entity_type: PhotoEntityType; entity_id: number } | undefined;

  if (!photo) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  db.transaction(() => {
    db.prepare('UPDATE photos SET is_cover = 0 WHERE owner_id = ? AND entity_type = ? AND entity_id = ?')
      .run(owner, photo.entity_type, photo.entity_id);
    db.prepare('UPDATE photos SET is_cover = 1 WHERE id = ? AND owner_id = ?')
      .run(photo.id, owner);
  })();

  res.json(db.prepare('SELECT * FROM photos WHERE id = ? AND owner_id = ?').get(photo.id, owner));
});

router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const photo = db.prepare('SELECT * FROM photos WHERE id = ? AND owner_id = ?')
    .get(req.params.id, owner) as { id: number } | undefined;

  if (!photo) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  db.prepare('DELETE FROM photos WHERE id = ? AND owner_id = ?').run(photo.id, owner);
  removePhotoFiles(photo.id);
  res.status(204).send();
});

router.get('/file/:photoId/:filename', (req: Request, res: Response) => {
  const photoId = String(req.params.photoId);
  const filename = String(req.params.filename);
  const filePath = path.join(dataDir(), 'uploads', 'photos', photoId, filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'File not found' });
    return;
  }
  res.sendFile(filePath);
});

export default router;
