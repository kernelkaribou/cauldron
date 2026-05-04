import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface TokenPayload {
  sub: number;
  email: string;
  role: string;
}

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

export function signToken(payload: TokenPayload): string {
  const expiry = process.env.JWT_EXPIRY || '24h';
  return jwt.sign(payload as object, secret(), { expiresIn: expiry as jwt.SignOptions['expiresIn'] });
}

export function verifyToken(token: string): TokenPayload & { iat: number; exp: number } {
  const decoded = jwt.verify(token, secret());
  return decoded as unknown as TokenPayload & { iat: number; exp: number };
}
