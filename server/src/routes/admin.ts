import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db.js';
import { ownerId } from '../middleware/owner.js';
import { validate } from '../middleware/validate.js';
import { requireAdmin } from '../auth/middleware.js';
import { hashPassword } from '../auth/passwords.js';

const router = Router();

function parseUserId(id: string): number | null {
  if (!/^\d+$/.test(id)) return null;
  return parseInt(id, 10);
}

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'user']).optional(),
});

const updateUserSchema = z.object({
  role: z.enum(['admin', 'user']).optional(),
  name: z.string().min(1).max(100).optional(),
});

const setPasswordSchema = z.object({
  password: z.string().min(8),
});

interface UserRow {
  id: number;
  email: string;
  name: string;
  role: string;
  password_hash: string;
  avatar: string | null;
  created_at: string;
}

function formatUser(user: UserRow) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    has_password: user.password_hash !== 'proxy-auth-no-password',
    created_at: user.created_at,
  };
}

function isLastAdmin(db: ReturnType<typeof getDb>, userId: number): boolean {
  const { count } = db.prepare(
    "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND id != ?"
  ).get(userId) as { count: number };
  return count === 0;
}

// List users (admin only)
router.get('/users', requireAdmin, (_req: Request, res: Response) => {
  const db = getDb();
  const users = db.prepare(
    'SELECT id, email, name, role, password_hash, avatar, created_at FROM users ORDER BY created_at ASC'
  ).all() as UserRow[];
  res.json({ items: users.map(formatUser) });
});

// Create user (admin only)
router.post('/users', requireAdmin, validate(createUserSchema), async (req: Request, res: Response) => {
  const db = getDb();
  const { email, password, name, role } = req.body;

  const passwordHash = await hashPassword(password);
  try {
    const result = db.prepare(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
    ).run(email, passwordHash, name, role || 'user');

    const user = db.prepare(
      'SELECT id, email, name, role, password_hash, avatar, created_at FROM users WHERE id = ?'
    ).get(result.lastInsertRowid) as UserRow;
    res.status(201).json(formatUser(user));
  } catch (err: any) {
    if (err?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ error: 'Email already exists' });
      return;
    }
    throw err;
  }
});

// Update user (admin only)
router.patch('/users/:id', requireAdmin, validate(updateUserSchema), (req: Request, res: Response) => {
  const db = getDb();
  const userId = parseUserId(req.params.id as string);
  if (!userId) { res.status(400).json({ error: 'Invalid user ID' }); return; }
  const caller = ownerId(req);

  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(userId) as { id: number; role: string } | undefined;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Prevent demoting the last admin
  if (req.body.role && req.body.role !== 'admin' && user.role === 'admin') {
    if (isLastAdmin(db, userId)) {
      res.status(400).json({ error: 'Cannot demote the last admin' });
      return;
    }
  }

  const fields = Object.entries(req.body).filter(([, v]) => v !== undefined);
  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  const setClause = fields.map(([key]) => `${key} = ?`).join(', ');
  const values = fields.map(([, v]) => v);
  db.prepare(`UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values, userId);

  const updated = db.prepare(
    'SELECT id, email, name, role, password_hash, avatar, created_at FROM users WHERE id = ?'
  ).get(userId) as UserRow;
  res.json(formatUser(updated));
});

// Set/reset password for a user (admin only)
router.put('/users/:id/password', requireAdmin, validate(setPasswordSchema), async (req: Request, res: Response) => {
  const db = getDb();
  const userId = parseUserId(req.params.id as string);
  if (!userId) { res.status(400).json({ error: 'Invalid user ID' }); return; }

  const user = db.prepare('SELECT id, token_version FROM users WHERE id = ?')
    .get(userId) as { id: number; token_version: number } | undefined;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const passwordHash = await hashPassword(req.body.password);
  db.prepare(
    'UPDATE users SET password_hash = ?, token_version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(passwordHash, user.token_version + 1, userId);

  res.json({ message: 'Password updated' });
});

// Delete user (admin only, not self, not last admin, no owned data)
router.delete('/users/:id', requireAdmin, (req: Request, res: Response) => {
  const db = getDb();
  const userId = parseUserId(req.params.id as string);
  if (!userId) { res.status(400).json({ error: 'Invalid user ID' }); return; }
  const caller = ownerId(req);

  if (userId === caller) {
    res.status(400).json({ error: 'Cannot delete your own account' });
    return;
  }

  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(userId) as { id: number; role: string } | undefined;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (user.role === 'admin' && isLastAdmin(db, userId)) {
    res.status(400).json({ error: 'Cannot delete the last admin' });
    return;
  }

  // Check for owned data
  const tables = [
    'crafts', 'projects', 'techniques', 'materials', 'curiosities',
    'categories', 'tags', 'notes', 'photos', 'logs', 'tasks',
    'material_vendors', 'material_stock',
  ];
  const ownedCounts: Record<string, number> = {};
  let totalOwned = 0;
  for (const table of tables) {
    const { count } = db.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE owner_id = ?`).get(userId) as { count: number };
    if (count > 0) {
      ownedCounts[table] = count;
      totalOwned += count;
    }
  }

  if (totalOwned > 0) {
    res.status(409).json({
      error: 'User has owned data. Reassign or delete their data first.',
      owned: ownedCounts,
    });
    return;
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  res.status(204).send();
});

export default router;
