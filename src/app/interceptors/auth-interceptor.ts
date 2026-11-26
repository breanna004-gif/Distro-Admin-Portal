
import { inject } from '@angular/core';
import {
  HttpEvent,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import {
  Observable,
  catchError,
  finalize,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError
} from 'rxjs';

import { AuthResponse, AuthService } from '../services/auth';
import {
  API_BASE_URL,
  USE_API_PROXY
} from '../system/system.config';

let refreshRequest$: Observable<AuthResponse> | null = null;
const responseCache = new Map<
  string,
  { response: HttpResponse<unknown>; cachedAt: number }
>();
const inFlightRequests = new Map<string, Observable<HttpEvent<unknown>>>();
const RESPONSE_CACHE_TTL_MS = 30_000;
const BACKGROUND_REFRESH_AFTER_MS = 15_000;
const MAX_CACHED_RESPONSES = 100;
let cacheGeneration = 0;

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

  const authenticatedRequest = apiRequest.clone({
    setHeaders: headers
  });

  if (isApiRequest && authenticatedRequest.method !== 'GET') {
    cacheGeneration += 1;
    responseCache.clear();
    inFlightRequests.clear();
  }

  const sendRequest = (
    request: HttpRequest<unknown>
  ): Observable<HttpEvent<unknown>> =>
    next(request).pipe(
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
            next(request.clone({
              setHeaders: {
                Authorization: 'Bearer ' + response.accessToken
              }
            }))
          )
        );
      })
    );

  const isCacheableGet =
    isApiRequest &&
    authenticatedRequest.method === 'GET' &&
    /^\/api(?:\/|$)/.test(requestUrl.pathname) &&
    !requestUrl.pathname.endsWith('/api/notifications/unread-count') &&
    !isAuthEndpoint &&
    authenticatedRequest.responseType === 'json';

  if (!isCacheableGet) {
    return sendRequest(authenticatedRequest);
  }

  const cacheKey = [
    authenticatedRequest.urlWithParams,
    authenticatedRequest.headers.get('Authorization') ?? '',
    authenticatedRequest.headers.get('Accept') ?? ''
  ].join('|');

  const cached = responseCache.get(cacheKey);
  const cacheAgeMs = cached ? Date.now() - cached.cachedAt : Infinity;

  const fetchAndCache = (): Observable<HttpEvent<unknown>> => {
    const pending = inFlightRequests.get(cacheKey);
    if (pending) {
      return pending;
    }

    const requestGeneration = cacheGeneration;
    let sharedRequest$!: Observable<HttpEvent<unknown>>;
    sharedRequest$ = sendRequest(authenticatedRequest).pipe(
      tap(event => {
        if (
          !(event instanceof HttpResponse) ||
          requestGeneration !== cacheGeneration
        ) {
          return;
        }

        responseCache.delete(cacheKey);
        responseCache.set(cacheKey, {
          response: event,
          cachedAt: Date.now()
        });

        if (responseCache.size > MAX_CACHED_RESPONSES) {
          const oldestKey = responseCache.keys().next().value;
          if (oldestKey !== undefined) {
            responseCache.delete(oldestKey);
          }
        }
      }),
      finalize(() => {
        if (inFlightRequests.get(cacheKey) === sharedRequest$) {
          inFlightRequests.delete(cacheKey);
        }
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    inFlightRequests.set(cacheKey, sharedRequest$);
    return sharedRequest$;
  };

  if (cached && cacheAgeMs < RESPONSE_CACHE_TTL_MS) {
    responseCache.delete(cacheKey);
    responseCache.set(cacheKey, cached);

    if (cacheAgeMs >= BACKGROUND_REFRESH_AFTER_MS) {
      fetchAndCache().subscribe({
        error: error => console.error(
          'Background API response refresh failed:',
          error
        )
      });
    }

    return of(cached.response.clone());
  }

  if (cached) {
    responseCache.delete(cacheKey);
  }

  return fetchAndCache();
};
