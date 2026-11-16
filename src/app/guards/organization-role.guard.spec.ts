import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import {
  distributorDashboardGuard,
  manufacturerDashboardGuard,
  organizationManagementGuard,
  userManagementGuard
} from './organization-role.guard';

describe('organization role guards', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideRouter([])
      ]
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  function setUser(
    role: string,
    organizationType?: string
  ): void {
    localStorage.setItem('admin_user', JSON.stringify({
      id: 'user-id',
      name: 'Test User',
      email: 'test@example.com',
      role,
      organizationType,
      status: 'ACTIVE'
    }));
  }

  it('allows manufacturer users only into their matching dashboard', () => {
    setUser('MANUFACTURER_ADMIN');

    expect(TestBed.runInInjectionContext(() =>
      manufacturerDashboardGuard({} as never, {} as never)
    )).toBe(true);

    expect(TestBed.runInInjectionContext(() =>
      distributorDashboardGuard({} as never, {} as never)
    )).not.toBe(true);
  });

  it('uses organization type for a generic organization admin', () => {
    setUser('ORGANIZATION_ADMIN', 'DISTRIBUTOR');

    expect(TestBed.runInInjectionContext(() =>
      distributorDashboardGuard({} as never, {} as never)
    )).toBe(true);

    expect(TestBed.runInInjectionContext(() =>
      manufacturerDashboardGuard({} as never, {} as never)
    )).not.toBe(true);
  });

  it('allows organization admins to manage users but not organizations', () => {
    setUser('ORGANIZATION_ADMIN', 'MANUFACTURER');

    expect(TestBed.runInInjectionContext(() =>
      userManagementGuard({} as never, {} as never)
    )).toBe(true);

    expect(TestBed.runInInjectionContext(() =>
      organizationManagementGuard({} as never, {} as never)
    )).not.toBe(true);
  });
});
