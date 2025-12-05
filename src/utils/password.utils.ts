import * as argon2 from 'argon2';
import type { Response } from 'express';

export const setAuthCookie = (res: Response, token: string) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('accessToken', token, {
        httpOnly: true, // ✅ Prevent XSS attacks
        secure: isProduction, // ✅ HTTPS only in production
        sameSite: isProduction ? 'strict' : 'lax', // ✅ CSRF protection
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
    });
};

export class PasswordUtils {
    static async hashPassword(password: string): Promise<string> {
        return await argon2.hash(password);
    }

    static async verifyPassword(hash: string, password: string): Promise<boolean> {
        return await argon2.verify(hash, password);
    }
}