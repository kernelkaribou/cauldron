import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details: Record<string, string> = {};
        for (const issue of err.issues) {
          const key = issue.path.join('.');
          details[key] = issue.message;
        }
        res.status(400).json({ error: 'Validation failed', details });
        return;
      }
      next(err);
    }
  };
}
