// server/src/config/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const decoded: any = verify(token, process.env.JWT_SECRET || 'secret');
    
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  authMiddleware(req, res, () => {
    if (req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
  });
};

export const moderatorMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  authMiddleware(req, res, () => {
    if (req.userRole !== 'ADMIN' && req.userRole !== 'MODERATOR') {
      return res.status(403).json({ error: 'Forbidden: Moderator+ access required' });
    }
    next();
  });
};
