import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from './auth';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('recognizes SUPER_ADMIN as a platform administrator', () => {
    localStorage.setItem('admin_user', JSON.stringify({
      id: 'super-admin-id',
      name: 'Super Admin',
      email: 'admin@example.com',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE'
    }));

    expect(service.isPlatformAdmin()).toBe(true);
  });

  it('posts login credentials to the auth login endpoint as an identifier', () => {
    service.login('admin@example.com', 'test-password').subscribe();

    const request = httpTesting.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      identifier: 'admin@example.com',
      password: 'test-password'
    });
    request.flush({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      homePath: '/manufacturer/dashboard',
      user: {
        id: 'admin-id',
        fullName: 'Platform Admin',
        email: 'admin@example.com',
        role: 'SUPER_ADMIN',
        phoneVerified: true
      }
    });

    expect(service.getToken()).toBe('access-token');
    expect(service.getRefreshToken()).toBe('refresh-token');
  });

  it('posts registration details to the auth register endpoint', () => {
    service.register(
      ' Michelle Makimei ',
      ' michelle@example.com ',
      ' +254712345678 ',
      'Password123!',
      'MANUFACTURER_ADMIN',
      ' SupplyChain HQ '
    ).subscribe();

    const request = httpTesting.expectOne('/api/auth/register');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      fullName: 'Michelle Makimei',
      email: 'michelle@example.com',
      phoneNumber: '+254712345678',
      password: 'Password123!',
      role: 'MANUFACTURER_ADMIN',
      organizationName: 'SupplyChain HQ'
    });
    request.flush({ message: 'Registration successful' });
  });
});
