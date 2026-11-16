import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { User } from '../models/user.model';
import { UsersService } from './users';

describe('UsersService', () => {
  let service: UsersService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(UsersService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads and maps users from the admin users endpoint', () => {
    const response = [{
      id: 'user-id',
      fullName: 'John Doe',
      email: 'john@example.com',
      phoneNumber: '254712345678',
      role: 'CUSTOMER' as const,
      organizationName: null,
      phoneVerified: true
    }];
    let receivedUsers: User[] | undefined;

    service.getUsers().subscribe(users => {
      receivedUsers = users;
    });

    const request = httpTesting.expectOne('/api/admin/users');
    expect(request.request.method).toBe('GET');
    request.flush(response);

    expect(receivedUsers).toEqual([{
      id: 'user-id',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '254712345678',
      role: 'CUSTOMER',
      status: 'PENDING',
      organizationId: undefined,
      organizationName: undefined,
      organizationType: undefined,
      invitationStatus: undefined,
      otpDeliveryStatus: undefined,
      activationLinkDeliveryStatus: undefined,
      invitationSentAt: undefined,
      phoneVerified: true
    }]);
  });

  it('loads users from the paginated admin response', () => {
    let receivedUsers: User[] | undefined;

    service.getUsers().subscribe(users => {
      receivedUsers = users;
    });

    const request = httpTesting.expectOne('/api/admin/users');
    request.flush({
      content: [{
        id: 'user-id',
        fullName: 'Teresa Wilson',
        email: 'teresa@gmail.com',
        phoneNumber: '+254711223344',
        role: 'CUSTOMER',
        organizationId: null,
        organizationName: null,
        organizationType: null,
        phoneVerified: true,
        status: 'ACTIVE'
      }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20
    });

    expect(receivedUsers).toEqual([{
      id: 'user-id',
      name: 'Teresa Wilson',
      email: 'teresa@gmail.com',
      phone: '+254711223344',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      organizationId: undefined,
      organizationName: undefined,
      organizationType: undefined,
      invitationStatus: undefined,
      otpDeliveryStatus: undefined,
      activationLinkDeliveryStatus: undefined,
      invitationSentAt: undefined,
      phoneVerified: true
    }]);
  });

  it('returns the total count from a paginated users response', () => {
    let count: number | undefined;

    service.getUserCount().subscribe(result => {
      count = result;
    });

    const request = httpTesting.expectOne('/api/admin/users');
    request.flush({
      content: [{
        id: 'user-id',
        fullName: 'Teresa Wilson',
        email: 'teresa@gmail.com',
        role: 'CUSTOMER',
        phoneVerified: true
      }],
      totalElements: 27,
      totalPages: 2,
      number: 0,
      size: 20
    });

    expect(count).toBe(27);
  });

  it('deletes a user at the admin users endpoint', () => {
    service.deleteUser('user-id').subscribe();

    const request = httpTesting.expectOne(
      '/api/admin/users/user-id'
    );
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });

  it('associates organization users by organization id or name', () => {
    let receivedUsers: User[] | undefined;

    service.getUsersForOrganization('org-1', 'Northwind')
      .subscribe(users => receivedUsers = users);

    const request = httpTesting.expectOne(
      '/api/admin/users?organizationId=org-1'
    );
    request.flush([
      {
        id: 'admin-1',
        fullName: 'Ada Admin',
        email: 'ada@example.com',
        role: 'MANUFACTURER_ADMIN',
        status: 'ACTIVE',
        organizationId: 'org-1',
        organizationName: 'Northwind',
        otpDeliveryStatus: 'SENT',
        activationLinkDeliveryStatus: 'DELIVERED',
        invitationStatus: 'INVITED',
        phoneVerified: true
      },
      {
        id: 'staff-1',
        fullName: 'Sam Staff',
        email: 'sam@example.com',
        role: 'MANUFACTURER_STAFF',
        status: 'ACTIVE',
        organizationName: 'Northwind',
        phoneVerified: true
      },
      {
        id: 'other-1',
        fullName: 'Other User',
        email: 'other@example.com',
        role: 'CUSTOMER',
        organizationId: 'org-2',
        organizationName: 'Other',
        phoneVerified: false
      }
    ]);

    expect(receivedUsers?.map(user => user.id)).toEqual(['admin-1', 'staff-1']);
    expect(receivedUsers?.[0]).toMatchObject({
      otpDeliveryStatus: 'SENT',
      activationLinkDeliveryStatus: 'DELIVERED',
      invitationStatus: 'INVITED'
    });
  });

  it('updates user status through the admin users endpoint', () => {
    service.deactivateUser('user-id').subscribe();

    const request = httpTesting.expectOne(
      '/api/admin/users/user-id/status'
    );
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'DEACTIVATED' });
    request.flush({
      id: 'user-id',
      fullName: 'John Doe',
      email: 'john@example.com',
      role: 'CUSTOMER',
      status: 'DEACTIVATED',
      phoneVerified: true
    });
  });
});
