import jwt from 'jsonwebtoken';
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

    
}

export default JWTUtils;