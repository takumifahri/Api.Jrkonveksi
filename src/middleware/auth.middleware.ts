import type { Request, Response, NextFunction } from 'express';
import JWTUtils from '../utils/jwt.js';

export type Role = 'Admin' | 'User' | 'Manager';
export const AdminRoles: Role[] = ['Admin', 'Manager'];

/* extend Request type */
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; role?: Role | undefined };
    }
  }
}

/**
 * Authenticate middleware - verify JWT from cookie or Authorization header
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = (req.cookies && (req.cookies as any).accessToken) || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized: Token missing' });

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const payload = JWTUtils.verifyToken(token, secret) as any;
    if (!payload?.userId) return res.status(401).json({ message: 'Unauthorized: Invalid token' });

    req.user = {
      id: Number(payload.userId),
      role: payload.role as Role | undefined
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized: Token invalid or expired' });
  }
};

/**
 * checkRole - now prefers req.user.role, fallback to x-user-role header
 */
export const checkRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // prefer role from authenticated user
    const roleFromUser = req.user?.role;
    let userRoles: Role[] = [];

    if (roleFromUser) {
      userRoles = [roleFromUser];
    } else {
      const userRoleHeader = req.headers['x-user-role'];
      if (!userRoleHeader) {
        return res.status(401).json({ message: 'Unauthorized: No role provided' });
      }
      if (Array.isArray(userRoleHeader)) {
        userRoles = (userRoleHeader as string[]).map(r => r.trim() as Role);
      } else {
        userRoles = (userRoleHeader as string).split(',').map(r => r.trim() as Role);
      }
    }

    const hasAllowed = userRoles.some(r => allowedRoles.includes(r));
    if (!hasAllowed) return res.status(403).json({ message: 'Forbidden: Insufficient role' });

    next();
  };
};