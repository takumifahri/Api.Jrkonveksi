import type { Request, Response, NextFunction } from "express";
import AuthService from "../../services/auth/auth.service.js";
import logger from "../../utils/logger.js";
import { setAuthCookie } from "../../utils/password.utils.js";

const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const result = await AuthService.login(email, password);
        
        // ✅ Set HTTP-only cookie
        setAuthCookie(res, result.token);
        
        // ✅ Jangan return token di response body (optional, untuk extra security)
        const { token, ...responseWithoutToken } = result;
        
        res.json({
            ...responseWithoutToken,
            token: token,
            message: 'Login successful'
        });
    } catch (err) {
        next(err);
    }
};

const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, name, address, phone } = req.body;
        const result = await AuthService.register(email, password, name, address, phone);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
};

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
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
const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // ✅ Ambil token dari cookie dulu, fallback ke Authorization header
        const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(400).json({
                status: 'error',
                message: "No token provided"
            });
        }

        await AuthService.logout(token);

        // Hapus cookie
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });

        res.json({
            status: 'success',
            message: 'Logout successful'
        });
    } catch (err) {
        next(err);
    }
};

const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
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

const authController = {
    login,
    register,
    verifyToken,
    logout,
    refreshToken
};

export default authController;