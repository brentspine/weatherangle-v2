import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Observable,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
  timeout,
} from 'rxjs';
import { CurrentUser, LoginRequest } from '../models/auth.models';
import { AuthApiService } from './auth-api.service';

const ACCESS_TOKEN_STORAGE_KEY = 'wa_access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'wa_refresh_token';
const RESTORE_SESSION_TIMEOUT_MS = 10_000;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authApi = inject(AuthApiService);

  readonly accessToken = signal<string | null>(this.readStoredToken(ACCESS_TOKEN_STORAGE_KEY));
  readonly currentUser = signal<CurrentUser | null>(null);
  readonly isAuthenticated = computed(() => this.accessToken() !== null);

  private readonly refreshToken = signal<string | null>(
    this.readStoredToken(REFRESH_TOKEN_STORAGE_KEY),
  );
  // Dedupliziert parallele Refresh-Requests
  private refreshInProgress$: Observable<string> | null = null;

  login(request: LoginRequest): Observable<CurrentUser> {
    return this.authApi.login(request).pipe(
      catchError((err) => {
        this.clearTokens();
        return throwError(() => err);
      }),
      tap((response) => this.storeTokens(response.accessToken, response.refreshToken)),
      switchMap(() => this.authApi.getCurrentUser()),
      tap((user) => this.currentUser.set(user)),
    );
  }

  logout(): void {
    this.clearTokens();
    this.currentUser.set(null);
  }

  // Von authInterceptor bei 401 aufgerufen
  refreshAccessToken(): Observable<string> {
    if (this.refreshInProgress$) {
      return this.refreshInProgress$;
    }

    const refreshToken = this.refreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    this.refreshInProgress$ = this.authApi.refresh(refreshToken).pipe(
      tap((response) => this.storeTokens(response.accessToken, response.refreshToken)),
      map((response) => response.accessToken),
      catchError((err) => {
        this.clearTokens();
        this.currentUser.set(null);
        return throwError(() => err);
      }),
      finalize(() => {
        this.refreshInProgress$ = null;
      }),
      shareReplay(1),
    );

    return this.refreshInProgress$;
  }

  // Beim App-Start aufgerufen (app.config.ts)
  restoreSession(): Observable<void> {
    if (!this.accessToken()) {
      return of(undefined);
    }

    return this.authApi.getCurrentUser().pipe(
      timeout(RESTORE_SESSION_TIMEOUT_MS),
      tap((user) => this.currentUser.set(user)),
      switchMap(() => of(undefined)),
      catchError((err) => {
        // Nur bei bestätigter Ungültigkeit ausloggen, nicht bei Netzwerkfehler
        if (err instanceof HttpErrorResponse && (err.status === 401 || err.status === 403)) {
          this.clearTokens();
        }
        return of(undefined);
      }),
    );
  }

  private storeTokens(accessToken: string, refreshToken: string): void {
    this.accessToken.set(accessToken);
    this.refreshToken.set(refreshToken);
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  }

  private clearTokens(): void {
    this.accessToken.set(null);
    this.refreshToken.set(null);
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }

  private readStoredToken(key: string): string | null {
    return localStorage.getItem(key);
  }
}
