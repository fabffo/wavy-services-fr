import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, AuthUser } from '../types.js';
import { queryOne } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'changeme';

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Non authentifié' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = payload as AuthUser;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const token = header.slice(7);
      req.user = jwt.verify(token, JWT_SECRET) as AuthUser;
    } catch {
      // ignore invalid token
    }
  }
  next();
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export async function loadUserRoles(userId: string): Promise<string[]> {
  const rows = await queryOne<{ roles: string[] }>(
    `SELECT ARRAY_AGG(role::text) as roles FROM public.user_roles WHERE user_id = $1`,
    [userId]
  );
  return rows?.roles ?? [];
}
