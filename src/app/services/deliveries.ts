import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpParams
} from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from './auth';
import { Delivery } from '../models/delivery.model';

@Injectable({
  providedIn: 'root'
})
export class DeliveriesService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  // The existing Spring Boot TripController serves delivery records here.
  private readonly apiUrl = '/api/v1/trips';

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();

    return new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json'
    });
  }

  getDeliveries(
    page: number = 0,
    size: number = 20,
    search: string = ''
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<any>(this.apiUrl, {
      params,
      headers: this.getHeaders()
    });
  }

  // These operations need matching backend endpoints before use.
  getDelivery(deliveryId: string): Observable<Delivery> {
    return this.http.get<Delivery>(
      `${this.apiUrl}/${deliveryId}`,
      { headers: this.getHeaders() }
    );
  }

  assignDriver(
    deliveryId: string,
    driverId: string
  ): Observable<Delivery> {
    return this.http.patch<Delivery>(
      `${this.apiUrl}/${deliveryId}/driver`,
      { driverId },
      { headers: this.getHeaders() }
    );
  }

  updateDeliveryStatus(
    deliveryId: string,
    status: Delivery['status']
  ): Observable<Delivery> {
    return this.http.patch<Delivery>(
      `${this.apiUrl}/${deliveryId}/status`,
      { status },
      { headers: this.getHeaders() }
    );
  }

  getDeliveryTracking(deliveryId: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/${deliveryId}/tracking`,
      { headers: this.getHeaders() }
    );
  }
}
