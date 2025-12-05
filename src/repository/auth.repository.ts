import { prisma } from "../config/prisma.config.js";

export interface IUserRepository {
    findByEmail(email: string): Promise<any>;
    createUser(data: any): Promise<any>;
    findById(id: number): Promise<any>;
}

export class UserRepository implements IUserRepository {
    async findByEmail(email: string): Promise<any> {
        return await prisma.user.findUnique({
            where: { email },
            include: { role: true }
        })
    }

    async findById(id: number): Promise<any> {
        return await prisma.user.findUnique({
            where: { id },
            include: { role: true }
        })
    }

    async createUser(data: any): Promise<any> {
        return await prisma.user.create({
            data,
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
}