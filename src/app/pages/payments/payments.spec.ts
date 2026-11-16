import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { Payment } from '../../models/payment.model';
import { PaymentsService } from '../../services/payments';
import { Payments } from './payments';

describe('Payments', () => {
  const payment: Payment = {
    id: 'payment-id',
    orderId: 'order-id',
    customerName: 'John Doe',
    amount: 1250,
    currency: 'KES',
    method: 'MPESA',
    status: 'PAID'
  };

  let component: Payments;
  let getPayments: ReturnType<typeof vi.fn>;
  let getPayment: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getPayments = vi.fn(() => of({
      content: [payment],
      totalElements: 1,
      totalPages: 1
    }));
    getPayment = vi.fn(() => of(payment));

    TestBed.configureTestingModule({
      imports: [Payments],
      providers: [
        {
          provide: PaymentsService,
          useValue: { getPayments, getPayment }
        }
      ]
    });

    component = TestBed.createComponent(Payments).componentInstance;
  });

  it('loads payments from the backend with paging and search', () => {
    component.loadPayments();

    expect(getPayments).toHaveBeenCalledWith(
      0,
      20,
      ''
    );
    expect(component.payments).toEqual([payment]);
    expect(component.totalElements).toBe(1);
  });

  it('loads payment details from the backend', () => {
    component.viewPayment('payment-id');

    expect(getPayment).toHaveBeenCalledWith('payment-id');
    expect(component.selectedPayment).toEqual(payment);
    expect(component.loadingPayment).toBe(false);
  });
});
