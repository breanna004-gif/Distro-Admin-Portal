import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router
} from '@angular/router';

import { AuthService } from '../services/auth';
import { User, OrganizationType } from '../models/user.model';

function currentUser(): User | null {
  return inject(AuthService).getCurrentUser();
}

function isPlatformAdmin(user: User): boolean {
  return user.role === 'SUPER_ADMIN' || user.role === 'PLATFORM_ADMIN';
}

export const organizationManagementGuard: CanActivateFn = () => {
  const router = inject(Router);
  const user = currentUser();

  return user && isPlatformAdmin(user)
    ? true
    : router.createUrlTree(['/dashboard']);
};

export const userManagementGuard: CanActivateFn = () => {
  const router = inject(Router);
  const user = currentUser();

  const canManageUsers = user && (
    isPlatformAdmin(user) ||
    user.role === 'ORGANIZATION_ADMIN' ||
    user.role === 'MANUFACTURER_ADMIN' ||
    user.role === 'DISTRIBUTOR_ADMIN'
  );

  return canManageUsers
    ? true
    : router.createUrlTree(['/dashboard']);
};

function createDashboardGuard(
  organizationType: OrganizationType
): CanActivateFn {
  return () => {
    const router = inject(Router);
    const user = currentUser();

    if (!user) {
      return router.createUrlTree(['/dashboard']);
    }

    if (isPlatformAdmin(user)) {
      return true;
    }

    const isOrganizationAdminForType =
      user.role === 'ORGANIZATION_ADMIN' &&
      user.organizationType?.toUpperCase() === organizationType;

    const isTypeMember =
      organizationType === 'MANUFACTURER'
        ? user.role === 'MANUFACTURER' ||
          user.role === 'MANUFACTURER_ADMIN' ||
          user.role === 'MANUFACTURER_STAFF'
        : user.role === 'DISTRIBUTOR' ||
          user.role === 'DISTRIBUTOR_ADMIN' ||
          user.role === 'DISTRIBUTOR_STAFF';

    return isOrganizationAdminForType || isTypeMember
      ? true
      : router.createUrlTree(['/dashboard']);
  };
}

export const manufacturerDashboardGuard =
  createDashboardGuard('MANUFACTURER');

export const distributorDashboardGuard =
  createDashboardGuard('DISTRIBUTOR');
