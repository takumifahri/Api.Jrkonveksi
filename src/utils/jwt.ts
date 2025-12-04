import * as jwt from 'jsonwebtoken';
import * as argon2 from 'argon2';

class JWTUtils {
    static generateToken(payload: object, secret: jwt.Secret, expiresIn: jwt.SignOptions['expiresIn']): string {
        const options: jwt.SignOptions = {};
        if (expiresIn !== undefined) {
            options.expiresIn = expiresIn;
        }
        return jwt.sign(payload, secret, options);
    }

    static verifyToken(token: string, secret: string): object | null {
        try {
            return jwt.verify(token, secret) as object;
        } catch (error) {
            return null;
        }
    }

    static async hashPassword(password: string): Promise<string> {
        return await argon2.hash(password);
    }

    static async verifyPassword(hash: string, password: string): Promise<boolean> {
        return await argon2.verify(hash, password);
    }
    
}

export default JWTUtils;