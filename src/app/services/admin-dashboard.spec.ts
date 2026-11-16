import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { AdminDashboardService } from './admin-dashboard';

describe('AdminDashboardService', () => {
  let service: AdminDashboardService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AdminDashboardService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads the repository-backed admin overview endpoint', () => {
    const response = {
      totalUsers: 12,
      totalProducts: 8,
      totalOrders: 17,
      pendingOrders: 3,
      totalPayments: 14,
      totalTrips: 9,
      lowStockProducts: 2
    };
    let receivedResponse:
      | typeof response
      | undefined;

    service.getDashboard().subscribe(result => {
      receivedResponse = result;
    });

    const request = httpTesting.expectOne('/api/admin/dashboard');
    expect(request.request.method).toBe('GET');
    request.flush(response);

    expect(receivedResponse).toEqual(response);
  });
});
