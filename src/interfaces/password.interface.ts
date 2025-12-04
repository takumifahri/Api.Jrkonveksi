export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token?: string | null;
    newPassword: string;
    confirmationPassword: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmationPassword: string;
}

export interface PasswordResponse {
    success: boolean;
    message: string;
}

export interface IPasswordService {
    // forgot password
    forgotPassword(request: ForgotPasswordRequest): Promise<PasswordResponse>;
    
    // reset password
    resetPassword(request: ResetPasswordRequest): Promise<PasswordResponse>;
   
    // change password
    changePassword(request: ChangePasswordRequest): Promise<PasswordResponse>;
}