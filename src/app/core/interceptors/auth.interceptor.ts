import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

function isApiRequest(url: string): boolean {
  return environment.apiUrl ? url.startsWith(environment.apiUrl) : !/^https?:\/\//i.test(url);
}

function isRefreshRequest(url: string): boolean {
  return url.endsWith('/auth/refresh');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.accessToken();

  const authorizedReq =
    token && isApiRequest(req.url) && !isRefreshRequest(req.url)
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authorizedReq).pipe(
    catchError((err) => {
      // 401 ist nur "abgelaufen" wenn wir einen Token mitgeschickt haben
      const isExpiredTokenError =
        err instanceof HttpErrorResponse && err.status === 401 && authorizedReq !== req;

      if (!isExpiredTokenError) {
        if (err instanceof HttpErrorResponse && err.status === 401) {
          authService.logout();
        }
        return throwError(() => err);
      }

      return authService.refreshAccessToken().pipe(
        switchMap((newAccessToken) =>
          next(req.clone({ setHeaders: { Authorization: `Bearer ${newAccessToken}` } })),
        ),
        catchError((refreshErr) => {
          authService.logout();
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
