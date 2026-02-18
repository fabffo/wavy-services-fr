import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types.js';

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Non authentifié' });
      return;
    }
    const userRoles = req.user.roles ?? [req.user.role];
    const hasRole = roles.some(r => userRoles.includes(r));
    if (!hasRole) {
      res.status(403).json({ error: 'Accès refusé' });
      return;
    }
    next();
  };
}
