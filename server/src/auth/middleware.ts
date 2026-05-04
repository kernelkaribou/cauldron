import { Request, Response, NextFunction } from 'express';
import { getDb } from '../db.js';
import { verifyToken } from './tokens.js';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
  avatar: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const db = getDb();

  // Mode 1: Reverse proxy header auth
  const proxyHeader = process.env.AUTH_PROXY_HEADER;
  if (proxyHeader) {
    const headerValue = req.headers[proxyHeader.toLowerCase()] as string | undefined;
    if (headerValue) {
      const email = headerValue.trim();
      let user = db.prepare('SELECT id, email, name, role, avatar FROM users WHERE email = ?').get(email) as AuthUser | undefined;

      if (!user && process.env.AUTH_PROXY_AUTO_CREATE !== 'false') {
        const result = db.prepare(
          'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
        ).run(email, 'proxy-auth-no-password', email.split('@')[0], 'user');
        user = {
          id: result.lastInsertRowid as number,
          email,
          name: email.split('@')[0],
          role: 'user',
          avatar: null,
        };
      }

      if (user) {
        req.user = user;
        return next();
      }
    }
  }

  // Mode 2: JWT cookie auth
  const token = req.cookies?.cauldron_token;
  if (token) {
    try {
      const payload = verifyToken(token);
      const user = db.prepare('SELECT id, email, name, role, avatar FROM users WHERE id = ?').get(payload.sub) as AuthUser | undefined;
      if (user) {
        req.user = user;
        return next();
      }
    } catch {
      // Invalid token — fall through to 401
    }
  }

  res.status(401).json({ error: 'Authentication required' });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}
