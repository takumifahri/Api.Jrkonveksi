import type { Request, Response, NextFunction } from "express";
import AuthService from "../../services/auth/auth.service.js";
import type { RegisterRequest, VerifyOTPRequest } from "../../interfaces/auth.interface.js";

const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data: RegisterRequest = req.body;
        const result = await AuthService.register(data);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { verificationId, otp }: VerifyOTPRequest = req.body;
        const result = await AuthService.verifyOTP(verificationId, otp);
        
        // // Set cookie if needed
        // res.cookie('accessToken', result.token, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === 'production',
        //     sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        //     maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        // });

        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

const resendOTP = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        const result = await AuthService.resendOTP(email);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const result = await AuthService.login(email, password);
        
        // Set cookie
        res.cookie('accessToken', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
        
        if (token) {
            await AuthService.logout(token);
        }

        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            path: '/'
        });

        res.status(200).json({
            status: 'success',
            message: 'Logged out successfully'
        });
    } catch (error) {
        next(error);
    }
};

const me = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const result = await AuthService.verifyToken(token);
        
        if (!result) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const AuthController = {
    register,
    verifyOTP,
    resendOTP,
    login,
    logout,
    me
};

export default AuthController;