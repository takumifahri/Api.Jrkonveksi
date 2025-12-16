import type {
    createUserRequest,
    updateUserRequest,
    UserResponse,
    IUserManagementRepository,
} from '../../interfaces/users.interface.js'

import { prisma } from '../../config/prisma.config.js'
import HttpException from '../../utils/HttpExecption.js'
import JWTUtils from '../../utils/jwt.js'
import logger from '../../utils/logger.js'
import * as jwt from 'jsonwebtoken'

import { UserManagementRepository } from '../../repository/admin/user.management.repository.js'
import { PasswordUtils } from '../../utils/password.utils.js'

class UserManagementService implements IUserManagementRepository {
    private userRepository = new UserManagementRepository();

    // CRUD
    async createUser(request: createUserRequest): Promise<UserResponse> {
        const { name, email, password, confirmPassword, role, phone, address, is_blocked, is_verified } = request;

        try {
            // Check if email already exists
            const emailExists = await this.userRepository.checkEmailExists(email);
            if (emailExists) {
                throw new HttpException(400, 'Email already exists');
            }

            if (name.length === 0 || email.length === 0 || password.length === 0 || confirmPassword.length === 0) {
                throw new HttpException(400, 'Name, email, password, and confirm password are required');
            }

            if (password !== confirmPassword) {
                throw new HttpException(400, 'Password and confirm password do not match');
            }

            if (name.length >= 255) {
                throw new HttpException(400, 'Name exceeds maximum length of 255 characters');
            }

            // Get user Role

            const hashedPassword = await PasswordUtils.hashPassword(password);

            // determine roleId: accept numeric role (role id) or fallback to default 'user' role id
            let assignedRoleId: number;
            if (role !== undefined && role !== null && role !== null) {
                const parsedId = typeof role === 'number' ? role : Number(role);
                if (Number.isNaN(parsedId)) {
                    throw new HttpException(400, 'Invalid role id');
                }
                const roleRecord = await prisma.role.findUnique({ where: { id: parsedId } as any });
                if (!roleRecord) {
                    throw new HttpException(400, 'Role not found');
                }
                assignedRoleId = roleRecord.id;
            } else {
                const defaultRole = await prisma.role.findFirst({ where: { name: 'user' } });
                if (!defaultRole) {
                    throw new HttpException(500, 'Default role not configured');
                }
                assignedRoleId = defaultRole.id;
            }

            const newUser = await this.userRepository.createUser({
                name,
                email,
                password: hashedPassword,
                roleId: assignedRoleId,
                phone: phone || null,
                address: address || null,
                is_blocked: is_blocked || false,
                is_verified: is_verified || false,
            });

            const resultData: UserResponse = {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                phone: newUser.phone,
                address: newUser.address,
                is_blocked: newUser.is_blocked,
                is_verified: newUser.is_verified,
                createdAt: newUser.createdAt,
                updatedAt: newUser.updatedAt,
                deletedAt: newUser.deletedAt,
            };
            return resultData;
        } catch (error) {
            logger.error('Error creating user', { error });
            throw new HttpException(500, 'Internal server error');
        }
    }

    async getAllUsers(params?: {
        q?: string
        name?: string
        email?: string
        role?: number | string
        is_blocked?: boolean
        is_verified?: boolean
        page?: number
        limit?: number
        sortBy?: string
        order?: 'asc' | 'desc'
    }): Promise<UserResponse[]> {
        try {
            const where: any = {}

            if (params?.q) {
                const q = String(params.q).trim()
                if (q.includes('@')) {
                    // If q looks like an email, do case-insensitive exact match
                    where.email = { equals: q, mode: 'insensitive' }
                } else {
                    // general text search across name / email / phone
                    where.OR = [
                        { name: { contains: q, mode: 'insensitive' } },
                        { email: { contains: q, mode: 'insensitive' } },
                        { phone: { contains: q, mode: 'insensitive' } },
                    ]
                }
            }

            if (params?.name) where.name = { contains: params.name, mode: 'insensitive' }
            if (params?.email) where.email = { contains: params.email, mode: 'insensitive' }
            if (typeof params?.is_blocked === 'boolean') where.is_blocked = params.is_blocked
            if (typeof params?.is_verified === 'boolean') where.is_verified = params.is_verified

            if (params?.role !== undefined && params.role !== null) {
                const roleVal = params.role
                if (typeof roleVal === 'number') {
                    where.roleId = roleVal
                } else {
                    const parsed = Number(roleVal)
                    if (!Number.isNaN(parsed)) {
                        where.roleId = parsed
                    } else {
                        const roleRecord = await prisma.role.findFirst({
                            where: { name: { equals: String(roleVal), mode: 'insensitive' } },
                        })
                        if (roleRecord) {
                            where.roleId = roleRecord.id
                        } else {
                            return []
                        }
                    }
                }
            }

            const page = params?.page && params.page > 0 ? Math.floor(params.page) : 1
            const limit = params?.limit && params.limit > 0 ? Math.floor(params.limit) : 25
            const skip = (page - 1) * limit
            const sortBy = params?.sortBy || 'createdAt'
            const order: 'asc' | 'desc' = params?.order || 'desc'

            const users = await this.userRepository.findUsers({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: order } as any
            })

            if (!users || users.length === 0) return []

            const result: UserResponse[] = users.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                phone: u.phone,
                address: u.address,
                // use prisma field names (adjust if your schema differs)
                is_blocked: u.is_blocked ?? u.isBlocked ?? false,
                is_verified: u.is_verified ?? false,
                createdAt: u.createdAt,
                updatedAt: u.updatedAt,
                deletedAt: u.deletedAt ?? u.deleteAt ?? null,
            }))

            return result
        } catch (error) {
            logger.error('Error fetching all users with params', { error, params })
            throw new HttpException(500, 'Internal server error')
        }
    }

    async getUserById(id: number): Promise<UserResponse> {
        try {
            const user = await this.userRepository.getUserById(id);
            if (!user) {
                throw new HttpException(404, 'User not found');
            }
            return user;
        } catch (error) {
            logger.error('Error fetching user by id', { error });
            throw new HttpException(500, 'Internal server error');
        }
    }

    async updateUser(id: number, data: any): Promise<UserResponse> {
        try {
            const user = await this.userRepository.updateUser(id, data);
            if (!user) {
                throw new HttpException(404, 'User not found');
            }
            return user;
        } catch (error) {
            logger.error('Error updating user', { error });
            throw new HttpException(500, 'Internal server error');
        }
    }

    async deleteUser(id: number): Promise<UserResponse> {
        try {
            const user = await this.userRepository.deleteUser(id);
            if (!user) {
                throw new HttpException(404, 'User not found');
            }
            return user;
        } catch (error) {
            logger.error('Error deleting user', { error });
            throw new HttpException(500, 'Internal server error');
        }
    }

    async softDeleteUser(id: number): Promise<any> {
        try {
            const user = await this.userRepository.softDeleteUser(id);
            if (!user) {
                throw new HttpException(404, 'User not found');
            }
            return {
                user
            };
        } catch (error) {
            logger.error('Error soft deleting user', { error });
            throw new HttpException(500, 'Internal server error');
        }
    }

    async blockUser(id: number): Promise<UserResponse> {
        try {
            const user = await this.userRepository.blockUser(id);
            if (!user) {
                throw new HttpException(404, 'User not found');
            }
            return user;
        } catch (error) {
            logger.error('Error blocking user', { error });
            throw new HttpException(500, 'Internal server error');
        }
    }

    async unblockUser(id: number): Promise<UserResponse> {
        try {
            const user = await this.userRepository.unblockUser(id);
            if (!user) {
                throw new HttpException(404, 'User not found');
            }
            return user;
        } catch (error) {
            logger.error('Error unblocking user', { error });
            throw new HttpException(500, 'Internal server error');
        }
    }
}

export default new UserManagementService()