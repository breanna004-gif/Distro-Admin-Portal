
import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';
import {
  Observable,
  catchError,
  finalize,
  shareReplay,
  switchMap,
  throwError
} from 'rxjs';

import { AuthResponse, AuthService } from '../services/auth';
import {
  API_BASE_URL,
  USE_API_PROXY
} from '../system/system.config';

let refreshRequest$: Observable<AuthResponse> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const apiOrigin = new URL(API_BASE_URL).origin;
  const requestUrl = new URL(req.url, API_BASE_URL);
  const isApiRequest = requestUrl.origin === apiOrigin;

  const isAuthEndpoint = /^\/api\/auth(?:\/|$)/.test(
    requestUrl.pathname
  );

  const token = authService.getToken();

  const apiRequest = !USE_API_PROXY &&
    isApiRequest &&
    /^\/api(?:\/|$)/.test(req.url)
    ? req.clone({ url: requestUrl.href })
    : req;

  const headers: Record<string, string> = {};

  if (token && isApiRequest && !isAuthEndpoint) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return next(apiRequest.clone({
    setHeaders: headers
  })).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        !isApiRequest ||
        isAuthEndpoint ||
        !token
      ) {
        return throwError(() => error);
      }

      const refreshToken = authService.getRefreshToken();

      if (!refreshToken) {
        authService.logout();
        return throwError(() => error);
      }

      if (!refreshRequest$) {
        refreshRequest$ = authService.refresh(refreshToken).pipe(
          catchError((refreshError: unknown) => {
            if (
              refreshError instanceof HttpErrorResponse &&
              (refreshError.status === 401 ||
                refreshError.status === 403)
            ) {
              authService.logout();
            }

            return throwError(() => refreshError);
          }),
          finalize(() => {
            refreshRequest$ = null;
          }),
          shareReplay({ bufferSize: 1, refCount: false })
        );
      }

      return refreshRequest$.pipe(
        switchMap(response =>
          next(apiRequest.clone({
            setHeaders: {
              Authorization: 'Bearer ' + response.accessToken
            }
          }))
        )
      );
    })
  );
};
