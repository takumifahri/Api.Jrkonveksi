import type { Request, Response, NextFunction } from 'express';

type Role = 'Admin' | 'User' | 'Manager';

export const checkRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.headers['x-user-role'] as Role | undefined;
    if (!userRole) {
        return res.status(401).json({ message: 'Unauthorized: No role provided' });
    }
    if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ message: 'Forbidden: Insufficient role' });
    }
    next();
    };
};

export const checkAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const isAuthenticated = Boolean(req.headers['x-authenticated-user']);
    if (!isAuthenticated) {
        return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
    }
    next();
};
