import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthService, AuthResponse } from '../../services/auth';
import { Login } from './login';

describe('Login', () => {
  it('navigates to the path returned by the backend after login', () => {
    const response: AuthResponse = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      homePath: '/manufacturer/dashboard',
      user: {
        id: 'user-id',
        fullName: 'Super Admin',
        email: 'admin@example.com',
        role: 'SUPER_ADMIN',
        phoneVerified: true
      }
    };
    const authService = {
      login: vi.fn(() => of(response))
    };

    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService }
      ]
    });

    const router = TestBed.inject(Router);
    const navigateByUrl = vi.spyOn(router, 'navigateByUrl');
    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;
    component.email = 'admin@example.com';
    component.password = 'password';

    component.login();

    expect(navigateByUrl).toHaveBeenCalledWith('/manufacturer/dashboard');
  });

  it('shows account verification guidance for an unverified account', () => {
    const authService = {
      login: vi.fn(() => throwError(() =>
        new HttpErrorResponse({
          status: 403,
          error: {
            code: 'ACCOUNT_NOT_VERIFIED',
            message: 'Verify your account before signing in.'
          }
        })
      ))
    };

    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService }
      ]
    });

    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;
    component.email = 'admin@example.com';
    component.password = 'password';

    component.login();

    expect(component.showVerificationLink).toBe(true);
    expect(component.errorMessage).toBe(
      'Verify your account before signing in.'
    );
    expect(sessionStorage.getItem('verification_identifier')).toBe(
      'admin@example.com'
    );
  });
});
