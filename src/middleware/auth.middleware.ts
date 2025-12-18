import type { Request, Response, NextFunction } from "express";
import JWTUtils from "../utils/jwt.js";

export type Role = "Admin" | "User" | "Manager";
export const AdminRoles: Role[] = ["Admin", "Manager"];
export const UserRoles: Role[] = ["User"];
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; role?: Role | undefined };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      (req.cookies && (req.cookies as any).accessToken) ||
      (authHeader ? String(authHeader).split(" ")[1] : undefined);

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const secret = process.env.JWT_SECRET || "your-secret-key";
    const payload = JWTUtils.verifyToken(token, secret) as any;
    if (!payload || !payload.userId) return res.status(401).json({ message: "Invalid token" });

    req.user = { id: Number(payload.userId), role: payload.role as Role | undefined };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const checkRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const roleFromReq = req.user?.role ?? (req.headers["x-user-role"] as string | undefined);
    if (!roleFromReq) return res.status(403).json({ message: "Forbidden" });
    if (!allowedRoles.includes(roleFromReq as Role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
};