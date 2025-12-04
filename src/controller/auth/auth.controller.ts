import type { Request, Response, NextFunction } from "express";
import AuthService from "../../services/auth/auth.service.js";
import logger from "../../utils/logger.js";

// Helper untuk set cookie
const setAuthCookie = (res: Response, token: string) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('accessToken', token, {
        httpOnly: true, // ✅ Prevent XSS attacks
        secure: isProduction, // ✅ HTTPS only in production
        sameSite: isProduction ? 'strict' : 'lax', // ✅ CSRF protection
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
    });
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const result = await AuthService.login(email, password);
        
        // ✅ Set HTTP-only cookie
        setAuthCookie(res, result.token);
        
        // ✅ Jangan return token di response body (optional, untuk extra security)
        const { token, ...responseWithoutToken } = result;
        
        res.json({
            ...responseWithoutToken,
            message: 'Login successful'
        });
    } catch (err) {
        next(err);
    }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, name, address, phone } = req.body;
        const result = await AuthService.register(email, password, name, address, phone);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
};

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // ✅ Ambil token dari cookie dulu, fallback ke Authorization header
        const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
        
        if (!token) {
            return res.status(401).json({ 
                status: 'error',
                message: "Token not provided" 
            });
        }
        
        const result = await AuthService.verifyToken(token);
        
        if (!result) {
            return res.status(401).json({ 
                status: 'error',
                message: "Invalid token" 
            });
        }
        
        res.json(result);
    } catch (err) {
        next(err);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // ✅ Clear cookie
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            path: '/',
        });
        
        logger.info('User logged out');
        
        res.json({
            status: 'success',
            message: 'Logged out successfully'
        });
    } catch (err) {
        next(err);
    }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.accessToken;
        
        if (!token) {
            return res.status(401).json({ 
                status: 'error',
                message: "Token not provided" 
            });
        }
        
        const result = await AuthService.verifyToken(token);
        
        if (!result) {
            return res.status(401).json({ 
                status: 'error',
                message: "Invalid token" 
            });
        }
        
        // ✅ Generate new token (optional: implement refresh token logic)
        res.json({
            status: 'success',
            message: 'Token is valid',
            user: result.user
        });
    } catch (err) {
        next(err);
    }
};