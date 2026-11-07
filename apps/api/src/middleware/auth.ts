import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Authentication is not configured' });
  }

  const authorization = req.headers.authorization;
  const [scheme, token, ...extra] = authorization?.trim().split(/\s+/) ?? [];
  if (scheme !== 'Bearer' || !token || extra.length > 0) {
    return res.status(401).json({ error: 'A valid Bearer token is required' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === 'string' || typeof decoded.id !== 'string') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.userId = decoded.id;
    if (typeof decoded.role === 'string') {
      req.userRole = decoded.role;
    }
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    return next();
  };
};
