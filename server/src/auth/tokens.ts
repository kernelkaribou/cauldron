import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface TokenPayload {
  sub: number;
  email: string;
  role: string;
  tv: number; // token_version — invalidated on password change
}

const ALGORITHM = 'HS256';
const ISSUER = 'cauldron';

function getSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  const dataDir = process.env.DATA_DIR || '/data';
  const secretPath = path.join(dataDir, 'jwt_secret');

  if (fs.existsSync(secretPath)) {
    return fs.readFileSync(secretPath, 'utf-8').trim();
  }

  // Generate and persist a new secret
  const secret = crypto.randomBytes(48).toString('base64');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(secretPath, secret, { mode: 0o600 });
  return secret;
}

let cachedSecret: string | null = null;

function secret(): string {
  if (!cachedSecret) cachedSecret = getSecret();
  return cachedSecret;
}

export function tokenExpiry(): string {
  return process.env.JWT_EXPIRY || '24h';
}

export function tokenExpiryMs(): number {
  const expiry = tokenExpiry();
  // Parse common patterns: '24h', '7d', '1h', etc.
  const match = expiry.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 24 * 60 * 60 * 1000; // default 24h
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * (multipliers[unit] || 3600000);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload as object, secret(), {
    algorithm: ALGORITHM,
    issuer: ISSUER,
    expiresIn: tokenExpiry() as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): TokenPayload & { iat: number; exp: number } {
  const decoded = jwt.verify(token, secret(), {
    algorithms: [ALGORITHM],
    issuer: ISSUER,
  });
  return decoded as unknown as TokenPayload & { iat: number; exp: number };
}
