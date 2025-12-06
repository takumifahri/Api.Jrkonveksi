import { prisma } from "../config/prisma.config.js";

export interface IUserRepository {
    findByEmail(email: string): Promise<any>;
    createUser(data: {
        email: string;
        password: string;
        name: string;
        address?: string | null;
        phone?: string | null;
        roleId?: number;
    }): Promise<any>;
    findById(id: number): Promise<any>;
    getLoginAttempts(email: string): Promise<number>;
    resetLoginAttempts(userId: number): Promise<void>;
    incrementTokenVersion(userId: number): Promise<void>;
}

export class UserRepository implements IUserRepository {
    async findByEmail(email: string) {
        return await prisma.user.findUnique({
            where: { email },
            include: { role: true }
        });
    }

    async findById(id: number) {
        return await prisma.user.findUnique({
            where: { id },
            include: { role: true }
        });
    }

    async createUser(data: {
        email: string;
        password: string;
        name: string;
        address?: string | null;
        phone?: string | null;
        roleId?: number;
    }) {
        return await prisma.user.create({
            data: {
                email: data.email,
                password: data.password,
                name: data.name,
                address: data.address || null,
                phone: data.phone || null,
                roleId: data.roleId || 2, // default User role
                is_verified: true,
                login_attempt: 0
            },
            include: { role: true }
        });
    }
    
    async getLoginAttempts(email: string): Promise<number> {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { login_attempt: true }
        });
        return user?.login_attempt || 0;
    }

    async resetLoginAttempts(userId: number) {
        await prisma.user.update({
            where: { id: userId },
            data: { login_attempt: 0, last_login: new Date() }
        });
    }

    async incrementTokenVersion(userId: number) {
        await prisma.user.update({
            where: { id: userId },
            data: { token_version: { increment: 1 } }
        });
    }
}