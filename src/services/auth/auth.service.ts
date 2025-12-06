import type {
    IAuthService,
    UserResponse,
    RegisterRequest,
    RegisterResponse,
    VerifyOTPResponse,
    LoginResponse
} from "../../interfaces/auth.interface.js";
import { prisma } from "../../config/prisma.config.js";
import HttpException from "../../utils/HttpExecption.js";
import JWTUtils from "../../utils/jwt.js";
import logger from "../../utils/logger.js";
import * as jwt from 'jsonwebtoken';
import { UserRepository } from "../../repository/auth.repository.js";
import { PasswordUtils } from "../../utils/password.utils.js";
import MailerService from "../mailer.service.js";
import { OTPRepository } from "../../repository/otp.repository.js";

class AuthService implements IAuthService {
    private userRepository = new UserRepository();
    private otpRepository = new OTPRepository();

    /**
     * Register: Create verification record with hashed password + OTP, send email
     * Returns verificationId for client to use in verify step
     */
    async register(data: RegisterRequest): Promise<RegisterResponse> {
        const { email, name, password, address, phone } = data;

        // Validate email not already registered
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new HttpException(409, 'Email already registered');
        }

        // Rate limit check (prevent spam)
        const existingVerif = await this.otpRepository.getVerificationByEmail(email);
        if (existingVerif && existingVerif.createdAt) {
            const timeSinceLastRequest = Date.now() - new Date(existingVerif.createdAt).getTime();
            if (timeSinceLastRequest < 60_000) { // 60 seconds
                throw new HttpException(429, 'Please wait before requesting another OTP');
            }
        }

        // Generate OTP and hash everything
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        const hashedOtp = await PasswordUtils.hashPassword(otp);
        const hashedPassword = await PasswordUtils.hashPassword(password);

        // Store verification record (includes all registration data)
        const verification = await this.otpRepository.createVerification({
            email,
            hashedOtp,
            expiresAt: otpExpiry,
            hashedPassword,
            name,
            address: address || null,
            phone: phone || null
        });

        // Send OTP email (use plain OTP in email)
        try {
            await MailerService.sendOTPEmail(email, otp, otpExpiry);
        } catch (mailErr) {
            // Cleanup verification if email fails
            await this.otpRepository.deleteVerification(verification.id);
            logger.error('Failed to send OTP email', { email, error: String(mailErr) });
            throw new HttpException(500, 'Failed to send verification email');
        }

        logger.info('Registration OTP sent', { email, verificationId: verification.id });

        return {
            verificationId: verification.id,
            message: 'OTP sent to email. Please verify within 5 minutes.'
        };
    }

    /**
     * Verify OTP: Validate OTP, create user from stored data, cleanup verification
     */
    async verifyOTP(verificationId: number, otpPlain: string): Promise<VerifyOTPResponse> {
        // Get verification record
        const verification = await this.otpRepository.getVerificationById(verificationId);
        
        if (!verification) {
            throw new HttpException(404, 'Verification not found or already used');
        }

        // Check if expired
        if (new Date() > new Date(verification.expires_at)) {
            await this.otpRepository.deleteVerification(verification.id);
            throw new HttpException(410, 'OTP expired. Please request a new one.');
        }

        // Check if already used
        if (verification.used) {
            throw new HttpException(400, 'OTP already used');
        }

        // Check max attempts (optional security)
        if (verification.attempts >= 5) {
            await this.otpRepository.deleteVerification(verification.id);
            throw new HttpException(429, 'Too many failed attempts. Please request a new OTP.');
        }

        // Verify OTP hash
        const isOTPValid = await PasswordUtils.verifyPassword(verification.otp_token, otpPlain);
        
        if (!isOTPValid) {
            // Increment failed attempts
            await this.otpRepository.incrementAttempts(verification.id);
            throw new HttpException(401, 'Invalid OTP');
        }

        // Check if email was already registered (race condition protection)
        const existingUser = await this.userRepository.findByEmail(verification.email);
        if (existingUser) {
            await this.otpRepository.deleteVerification(verification.id);
            throw new HttpException(409, 'Email already registered');
        }

        // Create user with stored data (password already hashed)
        const user = await this.userRepository.createUser({
            email: verification.email,
            password: verification.hashed_password, // already hashed
            name: verification.name,
            address: verification.address,
            phone: verification.phone,
            roleId: 2 // User role
        });

        // Mark verification as used and cleanup
        await this.otpRepository.markAsUsed(verification.id);

        // // Generate JWT token for auto-login
        // const secret = process.env.JWT_SECRET || 'your-secret-key';
        // const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

        // const token = JWTUtils.generateToken(
        //     {
        //         userId: user.id,
        //         name: user.name,
        //         email: user.email,
        //         role: user.role.name,
        //         tokenVersion: user.token_version
        //     },
        //     secret,
        //     expiresIn as jwt.SignOptions['expiresIn']
        // );

        logger.info('User registered and verified successfully', {
            userId: user.id,
            email: user.email
        });

        return {
            // token,
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

    /**
     * Resend OTP: Generate new OTP for existing verification
     */
    async resendOTP(email: string): Promise<{ message: string }> {
        // Get existing verification
        const verification = await this.otpRepository.getVerificationByEmail(email);
        
        if (!verification) {
            throw new HttpException(404, 'No pending verification found for this email');
        }

        // Rate limit check
        const timeSinceCreated = Date.now() - new Date(verification.createdAt).getTime();
        if (timeSinceCreated < 60_000) { // 60 seconds
            throw new HttpException(429, 'Please wait before requesting another OTP');
        }

        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
        const hashedOtp = await PasswordUtils.hashPassword(otp);

        // Update verification with new OTP
        await prisma.oTP_Verification.update({
            where: { id: verification.id },
            data: {
                otp_token: hashedOtp,
                expires_at: otpExpiry,
                attempts: 0, // reset attempts
                createdAt: new Date() // update timestamp for rate limiting
            }
        });

        // Send new OTP email
        await MailerService.sendOTPEmail(email, otp, otpExpiry);

        logger.info('OTP resent', { email, verificationId: verification.id });

        return { message: 'New OTP sent to email' };
    }

    /**
     * Login: Validate credentials, return token
     */
    async login(email: string, passwordPlain: string): Promise<LoginResponse> {
        logger.debug('Login attempt', { email });

        const user = await this.userRepository.findByEmail(email);

        if (!user) {
            logger.warn('Login failed: user not found', { email });
            throw new HttpException(401, "Invalid email or password");
        }

        // Check login attempts for security
        const loginAttempts = await this.userRepository.getLoginAttempts(email);
        if (loginAttempts > 0 && loginAttempts % 5 === 0) {
            await MailerService.sendWarningEmail(
                email,
                'Security Alert',
                `We detected ${loginAttempts} failed login attempts on your account.`
            );
        }

        // Verify password
        const isPasswordValid = await PasswordUtils.verifyPassword(user.password, passwordPlain);
        if (!isPasswordValid) {
            logger.warn('Login failed: invalid password', { email });
            await prisma.user.update({
                where: { email },
                data: { login_attempt: { increment: 1 } }
            });
            throw new HttpException(401, "Invalid email or password");
        }

        // Reset login attempts on successful login
        await this.userRepository.resetLoginAttempts(user.id);

        // Generate JWT
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
            token,
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

    /**
     * Verify Token: Check if JWT is valid and user exists
     */
    async verifyToken(token: string): Promise<{ user: UserResponse } | null> {
        try {
            const secret = process.env.JWT_SECRET || 'your-secret-key';
            const payload = JWTUtils.verifyToken(token, secret) as any;
            
            if (!payload?.userId) return null;

            const user = await this.userRepository.findById(payload.userId);
            if (!user) return null;

            // Check token version (for logout/revoke)
            if (payload.tokenVersion !== user.token_version) {
                return null;
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
        } catch (error) {
            return null;
        }
    }

    /**
     * Logout: Invalidate token by incrementing token version
     */
    async logout(token: string): Promise<void> {
        if (!token) {
            throw new HttpException(400, "No token provided");
        }

        try {
            const payload = JWTUtils.verifyToken(
                token,
                process.env.JWT_SECRET || 'your-secret-key'
            ) as any;

            if (payload?.userId) {
                await this.userRepository.incrementTokenVersion(payload.userId);
                logger.info('User logged out', { userId: payload.userId });
            }
        } catch (error) {
            // Token invalid or expired - that's okay for logout
            logger.debug('Logout with invalid token', { error });
        }
    }
}

export default new AuthService();