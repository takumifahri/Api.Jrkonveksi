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
    role: {
        id: number;
        name: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    address?: string | null;
    phone?: string | null;
}

export interface RegisterResponse {
    verificationId: number;
    message: string;
}

export interface VerifyOTPRequest {
    verificationId: number;
    otp: string;
}

export interface VerifyOTPResponse {
    user: UserResponse;
    // token: string;
}

export interface IAuthService {
    register(data: RegisterRequest): Promise<RegisterResponse>;
    verifyOTP(verificationId: number, otp: string): Promise<VerifyOTPResponse>;
    resendOTP(email: string): Promise<{ message: string }>;
    login(email: string, passwordPlain: string): Promise<LoginResponse>;
    verifyToken(token: string): Promise<{ user: UserResponse } | null>;
    logout(token: string): Promise<void>;
}