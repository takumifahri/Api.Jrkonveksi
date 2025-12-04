// Login
export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: UserResponse;
}

export interface UserResponse {
    id: number;
    uuid: string;
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    role : {
        id: number;
        name: string;
    };
    createdAt: Date;
    updatedAt: Date;
}


// Register
export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    address?: string | null;
    phone?: string | null;
}

export interface RegisterResponse {
    user: UserResponse;
}

export interface IAuthService {
    // Kontrak untuk pendaftaran pengguna baru
    register(email: string, passwordPlain: string, name: string, address?: string | null, phone?: string | null): Promise<RegisterResponse>;

    // Kontrak untuk login pengguna
    login(email: string, passwordPlain: string): Promise<LoginResponse>;

    // Kontrak untuk memverifikasi token dan mendapatkan data pengguna
    verifyToken(token: string): Promise<{ user: UserResponse } | null>;
}