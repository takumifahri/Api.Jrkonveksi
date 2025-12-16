import { prisma } from "../../config/prisma.config.js";

export interface IUserManagementRepository {
    // Crud
    createUser(data: any): Promise<any>;
    getAllUsers(): Promise<any[]>;
    getUserById(id: number): Promise<any>;
    updateUser(id: number, data: any): Promise<any>;
    deleteUser(id: number): Promise<any>;
    softDeleteUser(id: number): Promise<any>;

    // Find user
    findUsers(opts: {
        where?: any;
        skip?: number;
        take?: number;
        orderBy?: any;
    }): Promise<any[]>;
    // Validator
    checkEmailExists(email: string): Promise<boolean>;

    // Block and Unblock
    blockUser(id: number): Promise<any>;
    unblockUser(id: number): Promise<any>;
}

export class UserManagementRepository implements IUserManagementRepository {
    // CRUD
    async createUser(data: any): Promise<any> {
        return prisma.user.create({
            data,
            include: { role: true }
        });
    }

    async findUsers(opts: {
        where?: any | null;
        skip?: number | undefined;
        take?: number | undefined;
        orderBy?: any | null;
    }): Promise<any[]> {
        const args: any = {
            where: opts.where ?? undefined,
            include: { role: true }
        };

        if (opts.skip !== undefined) args.skip = opts.skip;
        if (opts.take !== undefined) args.take = opts.take;
        if (opts.orderBy !== undefined) args.orderBy = opts.orderBy;

        return prisma.user.findMany(args);
    }

    // keep getAllUsers for compatibility (optional)
    async getAllUsers(): Promise<any[]> {
        return this.findUsers({});
    }

    async getUserById(id: number): Promise<any> {
        return prisma.user.findUnique({
            where: { id },
            include: { role: true }
        });
    }

    async updateUser(id: number, data: any): Promise<any> {
        return prisma.user.update({
            where: { id },
            data,
            include: { role: true }
        });
    }

    async deleteUser(id: number): Promise<any> {
        return prisma.user.delete({
            where: { id }
        });
    }

    async softDeleteUser(id: number): Promise<any> {
        return prisma.user.update({
            where: { id },
            data: { deleteAt: new Date() }
        });
    }

    // Validator
    async checkEmailExists(email: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { email }
        });
        return user !== null;
    }

    // Block and Unblock
    async blockUser(id: number): Promise<any> {
        return prisma.user.update({
            where: { id },
            data: { isBlocked: true }
        });
    }

    async unblockUser(id: number): Promise<any> {
        return prisma.user.update({
            where: { id },
            data: { isBlocked: false }
        });
    }
}