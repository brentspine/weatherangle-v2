import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  CurrentUser,
  LoginRequest,
  OtcTokenResponse,
  PasswordResetInitiateRequest,
  PasswordResetRequest,
  PasswordResetVerifyRequest,
  RefreshRequest,
  RegisterEmailRequest,
  RegisterRequest,
  RegisterVerifyRequest,
} from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  registerRequestEmail(email: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/register/email`, {
      email,
    } satisfies RegisterEmailRequest);
  }

  registerVerifyCode(email: string, code: string): Observable<OtcTokenResponse> {
    return this.http.post<OtcTokenResponse>(`${this.baseUrl}/register/verify`, {
      email,
      code,
    } satisfies RegisterVerifyRequest);
  }

  registerAccount(request: RegisterRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/register`, request);
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request);
  }

  refresh(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, {
      refreshToken,
    } satisfies RefreshRequest);
  }

  getCurrentUser(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${this.baseUrl}/me`);
  }

  passwordResetRequest(email: string): Observable<string> {
    return this.http.post(
      `${this.baseUrl}/password/reset-request`,
      { email } satisfies PasswordResetInitiateRequest,
      { responseType: 'text' },
    );
  }

  passwordResetVerifyCode(email: string, code: string): Observable<OtcTokenResponse> {
    return this.http.post<OtcTokenResponse>(`${this.baseUrl}/password/reset-verify`, {
      email,
      code,
    } satisfies PasswordResetVerifyRequest);
  }

  passwordReset(request: PasswordResetRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/password/reset`, request);
  }
}
