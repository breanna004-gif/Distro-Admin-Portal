import { TestBed } from '@angular/core/testing';
import {
  HttpErrorResponse,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthResponse, AuthService } from '../services/auth';
import {
  API_BASE_URL,
  USE_API_PROXY
} from '../system/system.config';
import { authInterceptor } from './auth-interceptor';

describe('authInterceptor', () => {
  let authServiceMock: {
    getToken: () => string;
    getRefreshToken: () => string;
    refresh: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authServiceMock = {
      getToken: () => 'test-token',
      getRefreshToken: () => 'refresh-token',
      refresh: vi.fn(() => of({
        accessToken: 'refreshed-token',
        refreshToken: 'next-refresh-token',
        tokenType: 'Bearer',
        expiresInSeconds: 900,
        redirectPath: '/dashboard',
        user: {
          id: 'admin-id',
          fullName: 'Platform Admin',
          email: 'admin@example.com',
          role: 'PLATFORM_ADMIN',
          phoneVerified: true
        }
      } satisfies AuthResponse)),
      logout: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock
        }
      ]
    });
  });

  it('keeps API requests relative for the development proxy and adds the bearer header', () => {
    const request = new HttpRequest('GET', '/api/admin/users');
    let interceptedRequest: HttpRequest<unknown> | undefined;

    TestBed.runInInjectionContext(() =>
      authInterceptor(request, intercepted => {
        interceptedRequest = intercepted;
        return of(new HttpResponse());
      })
    );

    expect(USE_API_PROXY).toBe(true);
    expect(interceptedRequest?.url).toBe('/api/admin/users');
    expect(interceptedRequest?.headers.get('Authorization')).toBe(
      'Bearer test-token'
    );
  });

  it('attaches the bearer token to absolute requests to the configured API URL', () => {
    const request = new HttpRequest(
      'GET',
      `${API_BASE_URL}/api/admin/users`
    );
    let interceptedRequest: HttpRequest<unknown> | undefined;

    TestBed.runInInjectionContext(() =>
      authInterceptor(request, intercepted => {
        interceptedRequest = intercepted;
        return of(new HttpResponse());
      })
    );

    expect(interceptedRequest?.url).toBe(
      `${API_BASE_URL}/api/admin/users`
    );
    expect(interceptedRequest?.headers.get('Authorization')).toBe(
      'Bearer test-token'
    );
  });

  it('does not add bearer headers to external URLs', () => {
    const request = new HttpRequest('GET', 'https://example.com/data');
    let interceptedRequest: HttpRequest<unknown> | undefined;

    TestBed.runInInjectionContext(() =>
      authInterceptor(request, intercepted => {
        interceptedRequest = intercepted;
        return of(new HttpResponse());
      })
    );

    expect(interceptedRequest?.url).toBe('https://example.com/data');
    expect(interceptedRequest?.headers.has('Authorization')).toBe(false);
  });

  it('refreshes an expired access token once and retries the request', () => {
    const request = new HttpRequest('GET', '/api/admin/dashboard');
    const retriedRequests: HttpRequest<unknown>[] = [];
    let requestCount = 0;

    TestBed.runInInjectionContext(() =>
      authInterceptor(request, intercepted => {
        requestCount += 1;
        retriedRequests.push(intercepted);

        if (requestCount === 1) {
          return throwError(
            () => new HttpErrorResponse({ status: 401 })
          );
        }

        return of(new HttpResponse());
      }).subscribe()
    );

    expect(authServiceMock.refresh).toHaveBeenCalledWith('refresh-token');
    expect(requestCount).toBe(2);
    expect(retriedRequests[1].url).toBe('/api/admin/dashboard');
    expect(retriedRequests[1].headers.get('Authorization')).toBe(
      'Bearer refreshed-token'
    );
  });

  it('does not refresh failed login requests', () => {
    const request = new HttpRequest('POST', '/api/auth/login', {});
    let requestError: unknown;
    let interceptedRequest: HttpRequest<unknown> | undefined;

    TestBed.runInInjectionContext(() =>
      authInterceptor(request, intercepted => {
        interceptedRequest = intercepted;
        return throwError(
          () => new HttpErrorResponse({ status: 401 })
        );
      }).subscribe({
        error: error => {
          requestError = error;
        }
      })
    );

    expect(requestError).toBeInstanceOf(HttpErrorResponse);
    expect(authServiceMock.refresh).not.toHaveBeenCalled();
    expect(interceptedRequest?.headers.has('Authorization')).toBe(false);
  });
});
