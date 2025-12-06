import { prisma } from "../config/prisma.config.js";
import { PasswordUtils } from "../utils/password.utils.js";

export interface IOTPRepository {
    createVerification(data: {
        email: string;
        hashedOtp: string;
        expiresAt: Date;
        hashedPassword: string;
        name: string;
        address?: string | null;
        phone?: string | null;
    }): Promise<any>;
    
    getVerificationById(id: number): Promise<any | null>;
    getVerificationByEmail(email: string): Promise<any | null>;
    deleteVerification(id: number): Promise<void>;
    incrementAttempts(id: number): Promise<void>;
    markAsUsed(id: number): Promise<void>;
}

export class OTPRepository implements IOTPRepository {
    async createVerification(data: {
        email: string;
        hashedOtp: string;
        expiresAt: Date;
        hashedPassword: string;
        name: string;
        address?: string | null;
        phone?: string | null;
    }) {
        // Delete any existing verification for this email first
        await prisma.oTP_Verification.deleteMany({
            where: { email: data.email }
        });

        return await prisma.oTP_Verification.create({
            data: {
                email: data.email,
                otp_token: data.hashedOtp,
                expires_at: data.expiresAt,
                hashed_password: data.hashedPassword,
                name: data.name,
                address: data.address || null,
                phone: data.phone || null
            }
        });
    }

    async getVerificationById(id: number) {
        return await prisma.oTP_Verification.findUnique({
            where: { id }
        });
    }

    async getVerificationByEmail(email: string) {
        return await prisma.oTP_Verification.findFirst({
            where: {
                email,
                used: false,
                expires_at: { gt: new Date() }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async deleteVerification(id: number) {
        await prisma.oTP_Verification.delete({
            where: { id }
        });
    }

    async incrementAttempts(id: number) {
        await prisma.oTP_Verification.update({
            where: { id },
            data: { attempts: { increment: 1 } }
        });
    }

    async markAsUsed(id: number) {
        await prisma.oTP_Verification.update({
            where: { id },
            data: {
                used: true,
                deletedAt: new Date()
            }
        });
    }
}