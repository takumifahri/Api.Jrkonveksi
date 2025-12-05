import type { IAuthService, UserResponse, RegisterResponse, LoginResponse } from "../../interfaces/auth.interface.js";
import { prisma } from "../../config/prisma.config.js";
import HttpException from "../../utils/HttpExecption.js";
import JWTUtils from "../../utils/jwt.js";
import logger from "../../utils/logger.js";
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from "../../repository/auth.repository.js";
import { PasswordUtils, setAuthCookie } from "../../utils/password.utils.js";
import MailerService from "../mailer.service.js";

class AuthService implements IAuthService {
    private userRepository = new UserRepository();
    async login(email: string, passwordPlain: string): Promise<LoginResponse> {
        logger.debug('Login attempt', { email });

        const user = await this.userRepository.findByEmail(email);

        if (!user) {
            logger.warn('Login failed: user not found', { email });
            throw new HttpException(401, "Invalid email or password");
        }

        // cek security jika ada yg mencoba masuk dengan password yang salah berkali kali dan send email via mailer.service
        const loginAttempts = await this.userRepository.getLoginAttempts(email);
        if (loginAttempts > 0 && loginAttempts % 5 === 0) {
            // Kirim email notifikasi setiap kelipatan 5
            await MailerService.sendWarningEmail(email, 'Peringatan Keamanan Akun', `Kami mendeteksi ${loginAttempts} percobaan login yang gagal.`);
        }

        const isPasswordValid = await PasswordUtils.verifyPassword(user.password, passwordPlain);
        if (!isPasswordValid) {
            logger.warn('Login failed: invalid password', { email });
            await prisma.user.update({
                where: { email },
                data: { login_attempt: { increment: 1 } }
            });
            throw new HttpException(401, "Invalid email or password");
        }

        const secret = process.env.JWT_SECRET || 'your-secret-key';
        const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

        const token = JWTUtils.generateToken(
            {
                userId: user.id,
                name: user.name,
                email: user.email,
                role: user.role.name,
                tokenVersion: user.token_version
            },
            secret,
            expiresIn as jwt.SignOptions['expiresIn']
        );

        logger.info('User logged in successfully', {
            userId: user.id,
            email: user.email,
            role: user.role.name
        });

        return {
            token, // ✅ Masih return token untuk flexibility
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

    async verifyToken(token: string): Promise<{ user: UserResponse } | null> {
        try {
            const secret = process.env.JWT_SECRET || 'your-secret-key';
            const payload = JWTUtils.verifyToken(token, secret) as any;
            if (!payload?.userId) return null;

            const user = await prisma.user.findUnique({ where: { id: payload.userId }, include: { role: true } });
            if (!user) return null;

            // Check token version
            if (payload.tokenVersion !== user.token_version) {
                return null; // token revoked/old
            }

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

        // Cari existing user berdasarkan email
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new HttpException(409, 'Email already registered');
        }

        const hashedPassword = await PasswordUtils.hashPassword(passwordPlain);

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

        const user = await this.userRepository.createUser(userData);
        if (!user) {
            throw new HttpException(500, 'Failed to create user');
        }

        logger.info('User registered successfully', {
            userId: user.id,
            email: user.email
        });
        const userUUID = `USR-${uuidv4()}`;
        return {
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

    public async logout(token: string): Promise<void> {
        if (!token) {
            throw new HttpException(400, "No token provided");
        }
        const payload = JWTUtils.verifyToken(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        if (payload?.userId) {
            await prisma.user.update({
                where: { id: payload.userId },
                data: { login_attempt: 0, token_version: { increment: 1 }, last_login: new Date() }
            });
        }
    }
}

export default new AuthService();