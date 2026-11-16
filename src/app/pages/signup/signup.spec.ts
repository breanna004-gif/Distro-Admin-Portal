import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../services/auth';
import { Signup } from './signup';

describe('Signup', () => {
  it('registers the entered account and continues to verification', () => {
    const authService = {
      register: vi.fn(() => of({ message: 'Registration successful' }))
    };

    TestBed.configureTestingModule({
      imports: [Signup],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService }
      ]
    });

    const router = TestBed.inject(Router);
    const navigateByUrl = vi.spyOn(router, 'navigateByUrl');
    const fixture = TestBed.createComponent(Signup);
    const component = fixture.componentInstance;
    component.fullName = 'Michelle Makimei';
    component.email = 'michelle@example.com';
    component.phoneNumber = '+254712345678';
    component.password = 'Password123!';
    component.role = 'MANUFACTURER_ADMIN';
    component.organizationName = 'SupplyChain HQ';

    component.submitRegistration();

    expect(authService.register).toHaveBeenCalledWith(
      'Michelle Makimei',
      'michelle@example.com',
      '+254712345678',
      'Password123!',
      'MANUFACTURER_ADMIN',
      'SupplyChain HQ'
    );
    expect(sessionStorage.getItem('verification_identifier')).toBe(
      'michelle@example.com'
    );
    expect(navigateByUrl).toHaveBeenCalledWith('/verification');
  });

  it('rejects passwords that do not meet the backend requirements', () => {
    const authService = {
      register: vi.fn(() => of({}))
    };

    TestBed.configureTestingModule({
      imports: [Signup],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService }
      ]
    });

    const fixture = TestBed.createComponent(Signup);
    const component = fixture.componentInstance;
    component.fullName = 'Michelle Makimei';
    component.email = 'michelle@example.com';
    component.phoneNumber = '+254712345678';
    component.password = 'password';
    component.organizationName = 'SupplyChain HQ';

    component.submitRegistration();

    expect(authService.register).not.toHaveBeenCalled();
    expect(component.errorMessage).toContain('8–72 characters');
  });
});
