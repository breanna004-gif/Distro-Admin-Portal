import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { PaymentsService } from './payments';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(PaymentsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('requests payments with paging and search', () => {
    service.getPayments(1, 10, 'order').subscribe();

    const request = httpTesting.expectOne(
      request => request.url === '/api/v1/admin/payments'
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('10');
    expect(request.request.params.get('search')).toBe('order');
    request.flush({
      content: [],
      totalElements: 0,
      totalPages: 0
    });
  });

  it('requests one payment by ID', () => {
    service.getPayment('payment-id').subscribe();

    const request = httpTesting.expectOne(
      '/api/v1/admin/payments/payment-id'
    );

    expect(request.request.method).toBe('GET');
    request.flush({
      id: 'payment-id',
      orderId: 'order-id',
      customerName: 'John Doe',
      amount: 1250,
      currency: 'KES',
      method: 'MPESA',
      status: 'PAID'
    });
  });
});
