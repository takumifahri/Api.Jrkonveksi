import type { IAuthService, UserResponse, RegisterResponse, LoginResponse } from "../../interfaces/auth.interface.js";
import { prisma } from "../../config/prisma.config.js";
import HttpException from "../../utils/HttpExecption.js";
import JWTUtils from "../../utils/jwt.js";
import logger from "../../utils/logger.js";
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
class AuthService implements IAuthService {
    async login(email: string, passwordPlain: string): Promise<LoginResponse> {
        logger.debug('Login attempt', { email });

        const user = await prisma.user.findUnique({
            where: { email },
            include: { role: true }
        });

        if (!user) {
            logger.warn('Login failed: user not found', { email });
            throw new HttpException(401, "Invalid email or password");
        }

        const isPasswordValid = await JWTUtils.verifyPassword(user.password, passwordPlain);
        if (!isPasswordValid) {
            logger.warn('Login failed: invalid password', { email });
            throw new HttpException(401, "Invalid email or password");
        }

        const secret = process.env.JWT_SECRET || 'your-secret-key';
        const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

        const token = JWTUtils.generateToken(
            { userId: user.id, role: user.role.name },
            secret,
            expiresIn as jwt.SignOptions['expiresIn']
        );

        logger.info('User logged in successfully', {
            userId: user.id,
            email: user.email,
            role: user.role.name
        });
        const userUUID = `USR-${uuidv4()}`;
        return {
            token, // ✅ Masih return token untuk flexibility
            user: {
                id: user.id,
                uuid: userUUID,
                email: user.email,
                name: user.name,
                address: user.address,
                phone: user.phone,
                role: {
                    id: user.role.id,
                    name: user.role.name
                },
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        };
    }

    async verifyToken(token: string): Promise<{ user: UserResponse } | null> {
        try {
            const secret = process.env.JWT_SECRET || 'your-secret-key';
            const payload = JWTUtils.verifyToken(token, secret) as any;

            if (!payload || !payload.userId) return null;

            const user = await prisma.user.findUnique({
                where: { id: payload.userId },
                include: { role: true }
            });

            if (!user) return null;
            
            return {
                user: {
                    id: user.id,
                    uuid: user.unique_id,
                    email: user.email,
                    name: user.name,
                    address: user.address,
                    phone: user.phone,
                    role: {
                        id: user.role.id,
                        name: user.role.name
                    },
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            };
        } catch {
            return null;
        }
    }

    public async register(
        email: string,
        passwordPlain: string,
        name: string,
        address?: string | null,
        phone?: string | null
    ): Promise<RegisterResponse> {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            throw new HttpException(409, 'Email already registered');
        }

        const hashedPassword = await JWTUtils.hashPassword(passwordPlain);

        const userData: any = {
            email,
            password: hashedPassword,
            name,
            roleId: 2
        };

        if (address !== undefined) {
            userData.address = address;
        }

        if (phone !== undefined) {
            userData.phone = phone;
        }

        const user = await prisma.user.create({
            data: userData,
            select: {
                id: true,
                unique_id: true,
                email: true,
                name: true,
                address: true,
                phone: true,
                role: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                createdAt: true,
                updatedAt: true
            }
        });

        logger.info('User registered successfully', {
            userId: user.id,
            email: user.email
        });

        return {
            user: {
                id: user.id,
                uuid: user.unique_id,
                email: user.email,
                name: user.name,
                address: user.address,
                phone: user.phone,
                role: {
                    id: user.role.id,
                    name: user.role.name
                },
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        };
    }
}

export default new AuthService();