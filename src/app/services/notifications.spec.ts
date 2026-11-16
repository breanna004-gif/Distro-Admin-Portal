import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { AuthService } from './auth';
import { NotificationsService } from './notifications';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: { getToken: () => 'test-token' }
        }
      ]
    });

    service = TestBed.inject(NotificationsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('extracts the organization name from an access-request message', () => {
    let receivedName: string | undefined;

    service.getNotifications().subscribe(notifications => {
      receivedName = notifications[0].organizationName;
    });

    httpTesting.expectOne('/api/notifications').flush([{
      id: 'notification-1',
      title: 'New organization access request',
      message: 'New organization access request from Mukami Waruri for ABC distributors (DISTRIBUTOR). Review request request-1.',
      type: 'ACCESS_REQUEST',
      priority: 'HIGH',
      status: 'UNREAD',
      referenceId: 'request-1',
      createdAt: '2026-10-30T08:31:37.010244Z'
    }]);

    expect(receivedName).toBe('ABC distributors');
  });
});
