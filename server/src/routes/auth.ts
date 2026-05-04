import { Router, Request, Response } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { getDb } from '../db.js';
import { hashPassword, verifyPassword } from '../auth/passwords.js';
import { signToken, tokenExpiryMs } from '../auth/tokens.js';
import { authMiddleware } from '../auth/middleware.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many attempts, please try again later' },
});

const setupLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { error: 'Too many attempts, please try again later' },
});

const setupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

function cookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    ...(maxAge !== undefined ? { maxAge } : {}),
  };
}

function setCookie(res: Response, token: string, maxAge: number) {
  res.cookie('cauldron_token', token, cookieOptions(maxAge));
}

function clearAuthCookie(res: Response) {
  res.clearCookie('cauldron_token', cookieOptions());
}

// Check if setup is needed (public)
router.get('/setup-status', (_req: Request, res: Response) => {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  res.json({ needsSetup: count.count === 0 });
});

// Create first admin user (public, self-locking)
router.post('/setup', setupLimiter, validate(setupSchema), async (req: Request, res: Response) => {
  const db = getDb();
  const { email, password, name } = req.body;

  // Atomic check — use transaction to prevent race conditions
  const createAdmin = db.transaction(() => {
    const count = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (count.count > 0) {
      return null;
    }

    const passwordHash = null; // placeholder, set after async hash
    return db.prepare(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
    );
  });

  // Check first (non-transactional quick check)
  const count = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (count.count > 0) {
    res.status(403).json({ error: 'Setup already completed' });
    return;
  }

  const passwordHash = await hashPassword(password);

  // Transactional insert with recheck
  const insert = db.transaction(() => {
    const recheck = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (recheck.count > 0) return null;
    return db.prepare(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
    ).run(email, passwordHash, name, 'admin');
  });

  const result = insert();
  if (!result) {
    res.status(403).json({ error: 'Setup already completed' });
    return;
  }

  res.status(201).json({ message: 'Admin user created' });
});

// Login
router.post('/login', authLimiter, validate(loginSchema), async (req: Request, res: Response) => {
  const db = getDb();
  const { email, password } = req.body;

  const user = db.prepare('SELECT id, email, password_hash, name, role, token_version FROM users WHERE email = ?')
    .get(email) as { id: number; email: string; password_hash: string; name: string; role: string; token_version: number } | undefined;

  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = signToken({ sub: user.id, email: user.email, role: user.role, tv: user.token_version });
  const maxAge = tokenExpiryMs();

  setCookie(res, token, maxAge);
  res.json({ message: 'Logged in' });
});

// Logout
router.post('/logout', (_req: Request, res: Response) => {
  clearAuthCookie(res);
  res.json({ message: 'Logged out' });
});

// Current user
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  res.json(req.user);
});

// Update profile
router.put('/me', authMiddleware, validate(z.object({
  name: z.string().min(1).max(100),
})), (req: Request, res: Response) => {
  const db = getDb();
  db.prepare('UPDATE users SET name = ? WHERE id = ?').run(req.body.name, req.user!.id);
  const user = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(req.user!.id);
  res.json(user);
});

// Change password
router.post('/change-password', authMiddleware, authLimiter, validate(z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8),
})), async (req: Request, res: Response) => {
  const db = getDb();
  const user = db.prepare('SELECT password_hash, token_version FROM users WHERE id = ?')
    .get(req.user!.id) as { password_hash: string; token_version: number } | undefined;
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }

  const valid = await verifyPassword(req.body.current_password, user.password_hash);
  if (!valid) { res.status(401).json({ error: 'Current password is incorrect' }); return; }

  const newHash = await hashPassword(req.body.new_password);
  const newVersion = user.token_version + 1;
  db.prepare('UPDATE users SET password_hash = ?, token_version = ? WHERE id = ?')
    .run(newHash, newVersion, req.user!.id);

  // Issue new token with updated version, invalidating all old sessions
  const token = signToken({ sub: req.user!.id, email: req.user!.email, role: req.user!.role, tv: newVersion });
  const maxAge = tokenExpiryMs();
  setCookie(res, token, maxAge);

  res.json({ message: 'Password changed' });
});

export default router;
