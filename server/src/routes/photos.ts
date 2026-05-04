import { Router, Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { getDb } from '../db.js';
import { ownerId } from '../middleware/owner.js';

const router = Router();

const dataDir = () => process.env.DATA_DIR || '/data';

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

// List photos (filtered by formula_id or project_id)
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);
  const { formula_id, project_id } = req.query;

  let sql = 'SELECT * FROM photos WHERE owner_id = ?';
  const params: any[] = [owner];

  if (formula_id) {
    sql += ' AND formula_id = ?';
    params.push(formula_id);
  } else if (project_id) {
    sql += ' AND project_id = ?';
    params.push(project_id);
  }

  sql += ' ORDER BY sort_order ASC, created_at DESC';

  const items = db.prepare(sql).all(...params);
  res.json({ items });
});

router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image file provided' });
    return;
  }

  const db = getDb();
  const owner = ownerId(req);
  const { formula_id, project_id, caption } = req.body;

  if (!formula_id && !project_id) {
    fs.unlinkSync(req.file.path);
    res.status(400).json({ error: 'formula_id or project_id is required' });
    return;
  }

  if (formula_id) {
    const formula = db.prepare('SELECT id FROM formulas WHERE id = ? AND owner_id = ?').get(formula_id, owner);
    if (!formula) {
      fs.unlinkSync(req.file.path);
      res.status(404).json({ error: 'Formula not found' });
      return;
    }
  }

  if (project_id) {
    const project = db.prepare('SELECT id FROM projects WHERE id = ? AND owner_id = ?').get(project_id, owner);
    if (!project) {
      fs.unlinkSync(req.file.path);
      res.status(404).json({ error: 'Project not found' });
      return;
    }
  }

  const result = db.prepare(
    'INSERT INTO photos (owner_id, formula_id, project_id, image, caption) VALUES (?, ?, ?, ?, ?)'
  ).run(owner, formula_id || null, project_id || null, '', caption || null);

  const photoId = result.lastInsertRowid;

  const destDir = path.join(dataDir(), 'uploads', 'photos', String(photoId));
  const ext = path.extname(req.file.originalname);
  const filename = `original${ext}`;
  const destPath = path.join(destDir, filename);
  fs.mkdirSync(destDir, { recursive: true });
  fs.renameSync(req.file.path, destPath);

  await generateThumbnails(destPath, destDir);

  db.prepare('UPDATE photos SET image = ? WHERE id = ?').run(filename, photoId);

  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(photoId);
  res.status(201).json(photo);
});

router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const owner = ownerId(req);

  const photo = db.prepare('SELECT * FROM photos WHERE id = ? AND owner_id = ?')
    .get(req.params.id, owner) as any;

  if (!photo) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const photoDir = path.join(dataDir(), 'uploads', 'photos', String(photo.id));
  if (fs.existsSync(photoDir)) {
    fs.rmSync(photoDir, { recursive: true });
  }

  db.prepare('DELETE FROM photos WHERE id = ?').run(photo.id);
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
