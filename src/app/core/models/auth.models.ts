export interface RegisterEmailRequest {
  email: string;
}

export interface RegisterVerifyRequest {
  email: string;
  code: string;
}

export interface OtcTokenResponse {
  token: string;
}

export interface RegisterRequest {
  verificationToken: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// /auth/login und /auth/refresh
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface CurrentUser {
  id: string;
  username: string;
  email: string;
}

export interface PasswordResetInitiateRequest {
  email: string;
}

export interface PasswordResetVerifyRequest {
  email: string;
  code: string;
}

export interface PasswordResetRequest {
  resetToken: string;
  newPassword: string;
}

export interface ValidationErrorResponse {
  violations: Record<string, string>;
}
