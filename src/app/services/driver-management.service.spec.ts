import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { DriverManagementService } from './driver-management.service';

describe('DriverManagementService', () => {
  let service: DriverManagementService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(DriverManagementService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('sends driver credentials using the backend field names', () => {
    const requestBody = {
      fullName: 'Alex Driver',
      email: 'alex@example.com',
      phone: '+254700000000',
      licenseNumber: 'DL-12345',
      licenseExpiryDate: '2027-12-31',
      nationalId: 'ID-123',
      notes: ''
    };

    service.registerDriver(requestBody).subscribe();

    const request = httpTesting.expectOne('/api/v1/drivers');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(requestBody);
    request.flush({
      id: 'driver-1',
      ...requestBody,
      status: 'PENDING',
      createdAt: '2026-11-03T00:00:00Z',
      authorizations: [],
      onboarding: {
        status: 'INVITATION_PENDING',
        smsDeliveryStatus: 'QUEUED',
        emailDeliveryStatus: 'QUEUED'
      }
    });
  });

  it('maps backend driver credentials to the existing frontend model', () => {
    let received: {
      licenceNumber: string;
      licenceExpiry: string;
    } | undefined;

    service.getDrivers().subscribe(drivers => {
      received = {
        licenceNumber: drivers[0].licenceNumber,
        licenceExpiry: drivers[0].licenceExpiry
      };
    });

    httpTesting.expectOne('/api/v1/drivers').flush([{
      id: 'driver-1',
      fullName: 'Alex Driver',
      email: 'alex@example.com',
      phone: '+254700000000',
      licenseNumber: 'DL-12345',
      licenseExpiryDate: '2027-12-31',
      nationalId: 'ID-123',
      status: 'PENDING',
      createdAt: '2026-11-03T00:00:00Z',
      notes: '',
      authorizations: [],
      onboarding: {
        status: 'INVITATION_PENDING',
        smsDeliveryStatus: 'QUEUED',
        emailDeliveryStatus: 'QUEUED'
      }
    }]);

    expect(received).toEqual({
      licenceNumber: 'DL-12345',
      licenceExpiry: '2027-12-31'
    });
  });

  it('maps detail fields from a wrapped response with nested user data', () => {
    let received: {
      fullName: string;
      email: string;
      phone: string;
      nationalId: string;
      status: string;
      createdAt: string;
      licenceNumber: string;
    } | undefined;

    service.getDriverById('driver-1').subscribe(driver => {
      received = {
        fullName: driver.fullName,
        email: driver.email,
        phone: driver.phone,
        nationalId: driver.nationalId,
        status: driver.status,
        createdAt: driver.createdAt,
        licenceNumber: driver.licenceNumber
      };
    });

    httpTesting.expectOne('/api/v1/drivers/driver-1').flush({
      data: {
        driver: {
          id: 'driver-1',
          user: {
            fullName: 'Alex Driver',
            email: 'alex@example.com',
            phoneNumber: '+254700000000'
          },
          national_id: 'ID-123',
          licenseNumber: 'DL-12345',
          licenseExpiryDate: '2027-12-31',
          status: 'APPROVED',
          registeredAt: '2026-11-03T00:00:00Z',
          authorizations: []
        }
      }
    });

    expect(received).toEqual({
      fullName: 'Alex Driver',
      email: 'alex@example.com',
      phone: '+254700000000',
      nationalId: 'ID-123',
      status: 'APPROVED',
      createdAt: '2026-11-03T00:00:00Z',
      licenceNumber: 'DL-12345'
    });
  });

  it('approves a driver through the platform approval route', () => {
    let received: string | undefined;

    service.updateDriverStatus('driver-1', 'APPROVED').subscribe(driver => {
      received = driver.status;
    });

    const request = httpTesting.expectOne('/api/v1/admin/drivers/driver-1/approval');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'APPROVED' });
    request.flush({
      id: 'driver-1',
      fullName: 'Alex Driver',
      email: 'alex@example.com',
      phoneNumber: '+254700000000',
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
      nationalId: 'ID-123',
      licenseNumber: 'DL-12345',
      licenseExpiryDate: '2027-12-31'
    });

    expect(received).toBe('APPROVED');
  });

  it('sends a driver profile change to the platform approval route', () => {
    let received: string | undefined;

    service.reviewProfileChange('driver-1', 'APPROVED').subscribe(driver => {
      received = driver.pendingFullName;
    });

    const request = httpTesting.expectOne('/api/v1/admin/drivers/driver-1/profile-change');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ decision: 'APPROVED' });
    request.flush({
      id: 'driver-1',
      fullName: 'Alex Driver',
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
      pendingFullName: null
    });

    expect(received).toBe('');
  });

  it('shows a driver as pending while platform approval is still open', () => {
    let received: string | undefined;

    service.getDriverById('driver-1').subscribe(driver => {
      received = driver.status;
    });

    httpTesting.expectOne('/api/v1/drivers/driver-1').flush({
      id: 'driver-1',
      fullName: 'Alex Driver',
      status: 'ACTIVE',
      approvalStatus: 'PENDING_REVIEW'
    });

    expect(received).toBe('PENDING');
  });
});
