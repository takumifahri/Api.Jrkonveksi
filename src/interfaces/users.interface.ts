enum UserRole {
    ADMIN = 'admin',
    MANAGER = 'manager',
    USER = 'user',
}
export interface createUserRequest {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;

    role?: UserRole | 'user';

    phone?: string | null;
    address?: string | null;
    is_blocked?: boolean;
    is_verified?: boolean;
}

export interface updateUserRequest {
    name?: string;
    email?: string;
    phone?: string | null;
    address?: string | null;
    role?: UserRole | 'user';
    is_blocked?: boolean;
    is_verified?: boolean;

    updatedAt?: Date;
}

export interface UserResponse {
    id: number;
    unique_id: string;
    name: string;
    email: string;
    role: UserRole | 'user';
    phone?: string | null;
    address?: string | null;
    is_blocked: boolean;
    is_verified: boolean;

    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}

export interface IUserManagementRepository {
    // Crud
    createUser(data: any): Promise<UserResponse>;
    getAllUsers(): Promise<UserResponse[]>;
    getUserById(id: number): Promise<UserResponse>;
    updateUser(id: number, data: any): Promise<UserResponse>;
    deleteUser(id: number): Promise<UserResponse>;
    softDeleteUser(id: number): Promise<UserResponse>;
    
    // Block and Unblock
    blockUser(id: number): Promise<UserResponse>;
    unblockUser(id: number): Promise<UserResponse>;
}
