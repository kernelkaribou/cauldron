import { Request } from 'express';

export function ownerId(req: Request): number {
  return req.user!.id;
}
