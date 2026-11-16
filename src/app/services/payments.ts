import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Payment } from '../models/payment.model';

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

  private readonly apiUrl = '/api/v1/payments';


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

    return this.http.get<PaymentsPage | Payment[]>(
      this.apiUrl,
      { params }
    );

  }


  // ==========================================
  // GET SINGLE PAYMENT
  // ==========================================

  getPayment(
    paymentId: string
  ): Observable<Payment> {

    return this.http.get<Payment>(
      `${this.apiUrl}/${paymentId}`
    );

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
