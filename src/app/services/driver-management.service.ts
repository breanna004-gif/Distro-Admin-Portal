import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiCollection, unwrapApiCollection } from './api-collection';
import {
  Driver,
  DriverCompanyAuthorization,
  DriverStatus
} from '../models/driver.model';

export interface DriverRegistrationRequest {
  fullName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  nationalId: string;
  notes: string;
}

interface BackendDriver {
  id?: string;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  nationalId?: string | null;
  national_id?: string | null;
  status?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  registeredAt?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
  approvalStatus?: string | null;
  driverApprovalStatus?: string | null;
  authorizations?: DriverCompanyAuthorization[] | null;
  onboarding?: Driver['onboarding'] | null;
  licenseNumber?: string | null;
  licenseExpiryDate?: string | null;
  pendingFullName?: string | null;
  pendingPhoneNumber?: string | null;
  pendingLicenseNumber?: string | null;
  licenceNumber?: string | null;
  licenceExpiry?: string | null;
  driver?: BackendDriver | null;
  data?: BackendDriver | null;
  content?: BackendDriver | null;
  user?: BackendDriver | null;
}

@Injectable({
  providedIn: 'root'
})
export class DriverManagementService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/drivers';
  private readonly approvalUrl = '/api/v1/admin/drivers';

  getDrivers(): Observable<Driver[]> {
    return this.http
      .get<ApiCollection<BackendDriver>>(this.apiUrl)
      .pipe(
        map(response =>
          unwrapApiCollection(response).map(driver => this.mapDriver(driver))
        )
      );
  }

  getDriverById(id: string): Observable<Driver> {
    return this.http
      .get<BackendDriver>(`${this.apiUrl}/${id}`)
      .pipe(map(driver => this.mapDriver(driver)));
  }

  registerDriver(
    details: DriverRegistrationRequest
  ): Observable<Driver> {
    return this.http
      .post<BackendDriver>(this.apiUrl, details)
      .pipe(map(driver => this.mapDriver(driver)));
  }

  updateDriverStatus(
    id: string,
    status: DriverStatus
  ): Observable<Driver> {
    if (status === 'APPROVED' || status === 'REJECTED') {
      return this.http
        .patch<BackendDriver>(`${this.approvalUrl}/${id}/approval`, { status })
        .pipe(map(driver => this.mapDriver(driver)));
    }

    const accountStatus = status === 'INACTIVE' ? 'DEACTIVATED' : status;
    return this.http
      .patch<BackendDriver>(`${this.apiUrl}/${id}/status`, { status: accountStatus })
      .pipe(map(driver => this.mapDriver(driver)));
  }

  updateAccountStatus(
    id: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED'
  ): Observable<Driver> {
    return this.http
      .patch<BackendDriver>(`${this.apiUrl}/${id}/status`, { status })
      .pipe(map(driver => this.mapDriver(driver)));
  }

  resendInvitation(id: string): Observable<Driver> {
    return this.http
      .post<BackendDriver>(`${this.apiUrl}/${id}/invitation/resend`, {})
      .pipe(map(driver => this.mapDriver(driver)));
  }

  requestCompanyAuthorization(
    driverId: string,
    authorization: Omit<
      DriverCompanyAuthorization,
      'requestedAt' | 'status'
    >
  ): Observable<DriverCompanyAuthorization> {
    return this.http.post<DriverCompanyAuthorization>(
      `${this.apiUrl}/${driverId}/authorizations`,
      authorization
    );
  }

  reviewProfileChange(
    driverId: string,
    decision: 'APPROVED' | 'REJECTED'
  ): Observable<Driver> {
    return this.http
      .patch<BackendDriver>(`${this.approvalUrl}/${driverId}/profile-change`, { decision })
      .pipe(map(driver => this.mapDriver(driver)));
  }

  updateCompanyAuthorization(
    driverId: string,
    organizationId: string,
    status: DriverCompanyAuthorization['status']
  ): Observable<DriverCompanyAuthorization> {
    return this.http.patch<DriverCompanyAuthorization>(
      `${this.apiUrl}/${driverId}/authorizations/${organizationId}/status`,
      { status }
    );
  }

  private mapDriver(response: BackendDriver): Driver {
    let driver = response;
    while (driver.driver || driver.data || driver.content) {
      driver = driver.driver ?? driver.data ?? driver.content ?? driver;
    }

    const user = driver.user ?? {};
    const accountStatus = driver.status?.toUpperCase();
    const approvalStatus = (
      driver.approvalStatus ?? driver.driverApprovalStatus ?? ''
    ).toUpperCase();
    const normalizedStatus: DriverStatus =
      accountStatus === 'SUSPENDED'
        ? 'SUSPENDED'
        : accountStatus === 'DEACTIVATED' || accountStatus === 'INACTIVE'
          ? 'INACTIVE'
          : approvalStatus === 'APPROVED' || accountStatus === 'APPROVED'
            ? 'APPROVED'
            : approvalStatus === 'REJECTED' || accountStatus === 'REJECTED'
              ? 'REJECTED'
              : 'PENDING';

    return {
      id: driver.id ?? user.id ?? '',
      fullName: driver.fullName ?? user.fullName ?? '',
      email: driver.email ?? user.email ?? '',
      phone: driver.phone ?? driver.phoneNumber ??
        user.phone ?? user.phoneNumber ?? '',
      nationalId: driver.nationalId ?? driver.national_id ??
        user.nationalId ?? user.national_id ?? '',
      status: normalizedStatus,
      createdAt: driver.createdAt ?? driver.created_at ??
        driver.registeredAt ?? '',
      notes: driver.notes ?? driver.internalNotes ?? '',
      authorizations: Array.isArray(driver.authorizations)
        ? driver.authorizations
        : [],
      onboarding: driver.onboarding ?? {
        status: 'INVITATION_PENDING',
        smsDeliveryStatus: 'NOT_REQUESTED',
        emailDeliveryStatus: 'NOT_REQUESTED'
      },
      licenceNumber: driver.licenseNumber ?? driver.licenceNumber ?? '',
      licenceExpiry: driver.licenseExpiryDate ?? driver.licenceExpiry ?? '',
      pendingFullName: driver.pendingFullName ?? '',
      pendingPhoneNumber: driver.pendingPhoneNumber ?? '',
      pendingLicenseNumber: driver.pendingLicenseNumber ?? ''
    };
  }
}
