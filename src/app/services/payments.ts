import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { Payment } from '../models/payment.model';

interface PaymentApiRow extends Omit<Partial<Payment>, 'status'> {
  id: string;
  orderId: string;
  amount: number;
  mpesaReceiptNumber?: string;
  confirmedAt?: string;
  initiatedAt?: string;
  currency?: string;
  method?: Payment['method'];
  /** Backend may send CONFIRMED/RECONCILED/REVERSED before displayPayment normalizes. */
  status?: string;
  failureReason?: string;
}

function displayPayment(row: PaymentApiRow): Payment {
  const status = row.status === 'CONFIRMED' || row.status === 'RECONCILED'
    ? 'PAID'
    : row.status === 'REVERSED'
      ? 'REFUNDED'
      : (row.status as Payment['status']);
  return {
    id: row.id,
    orderId: row.orderId,
    customerName: row.customerName ?? '',
    organizationName: row.organizationName,
    amount: row.amount,
    currency: row.currency ?? 'KES',
    method: row.method ?? 'MPESA',
    status,
    transactionReference: row.transactionReference ?? row.mpesaReceiptNumber,
    paymentDate: row.paymentDate ?? row.confirmedAt ?? row.initiatedAt,
    createdAt: row.createdAt ?? row.initiatedAt,
    updatedAt: row.updatedAt,
    failureReason: row.failureReason
  };
}

export interface PaymentsPage {
  content: Payment[];
  totalElements: number;
  totalPages: number;
  number?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {

  private http = inject(HttpClient);

  private readonly apiUrl = '/api/v1/admin/payments';


  // ==========================================
  // GET PAYMENTS
  // ==========================================

  getPayments(
    page: number = 0,
    size: number = 20,
    search: string = ''
  ): Observable<PaymentsPage | Payment[]> {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (search.trim()) {

      params = params.set(
        'search',
        search.trim()
      );

    }

    return this.http.get<PaymentsPage | PaymentApiRow[]>(
      this.apiUrl,
      { params }
    ).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response.map(displayPayment);
        }
        return {
          ...response,
          content: (response.content ?? []).map(displayPayment)
        };
      })
    );

  }


  // ==========================================
  // GET SINGLE PAYMENT
  // ==========================================

  getPayment(
    paymentId: string
  ): Observable<Payment> {

    return this.http.get<PaymentApiRow>(
      `${this.apiUrl}/${paymentId}`
    ).pipe(map(displayPayment));

  }


  // ==========================================
  // GET PAYMENTS FOR ORDER
  // ==========================================

  getOrderPayments(
    orderId: string
  ): Observable<Payment[]> {

    return this.http.get<Payment[]>(
      `/api/v1/orders/${orderId}/payments`
    );

  }


  // ==========================================
  // UPDATE PAYMENT STATUS
  // ==========================================

  updatePaymentStatus(
    paymentId: string,
    status: Payment['status']
  ): Observable<Payment> {

    return this.http.patch<Payment>(
      `${this.apiUrl}/${paymentId}/status`,
      { status }
    );

  }

}

