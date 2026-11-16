import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpParams
} from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { Order } from '../models/order.model';
import { AuthService } from './auth';

export interface OrdersPageResponse {
  content: BackendOrderResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface OrderStatsResponse {
  totalOrders: number;
  activeOrders: number;
  pendingOrders: number;
  totalOrderValue: number;
}

interface BackendOrderResponse {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string | null;
  organizationId?: string | null;
  organizationName?: string | null;
  totalAmount: number;
  itemCount: number;
  status: Order['status'];
  paymentStatus: Order['paymentStatus'];
  deliveryStatus: Order['deliveryStatus'];
  deliveryAddress?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class OrdersService {

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private readonly apiUrl =
    '/api/v1/orders';

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getOrders(
    page: number = 0,
    size: number = 20,
    search: string = ''
  ): Observable<OrdersPageResponse> {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (search.trim()) {
      params = params.set(
        'search',
        search.trim()
      );
    }

    return this.http.get<OrdersPageResponse>(
      this.apiUrl,
      {
        params,
        headers: this.getHeaders()
      }
    );
  }

  getOrder(
    orderId: string
  ): Observable<Order> {

    return this.http
      .get<BackendOrderResponse>(
        `${this.apiUrl}/${orderId}`,
        {
          headers: this.getHeaders()
        }
      )
      .pipe(
        map(order => this.mapOrder(order))
      );
  }

  getOrderStats(): Observable<OrderStatsResponse> {

    return this.http.get<OrderStatsResponse>(
      `${this.apiUrl}/stats`,
      {
        headers: this.getHeaders()
      }
    );
  }

  createOrder(
    order: Partial<Order>
  ): Observable<Order> {

    return this.http.post<Order>(
      this.apiUrl,
      order,
      {
        headers: this.getHeaders()
      }
    );
  }

  updateOrder(
    orderId: string,
    order: Partial<Order>
  ): Observable<Order> {

    return this.http.put<Order>(
      `${this.apiUrl}/${orderId}`,
      order,
      {
        headers: this.getHeaders()
      }
    );
  }

  updateOrderStatus(
    orderId: string,
    status: Order['status']
  ): Observable<Order> {

    return this.http.patch<Order>(
      `${this.apiUrl}/${orderId}/status`,
      { status },
      {
        headers: this.getHeaders()
      }
    );
  }

  getOrderItems(
    orderId: string
  ): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/${orderId}/items`,
      {
        headers: this.getHeaders()
      }
    );
  }

  mapOrder(
    order: BackendOrderResponse
  ): Order {

    return {
      id: order.id,

      orderNumber: order.orderNumber,

      customerName: order.customerName,

      customerEmail:
        order.customerEmail ?? undefined,

      organizationName:
        order.organizationName ?? undefined,

      organizationId:
        order.organizationId ?? undefined,

      totalAmount:
        Number(order.totalAmount ?? 0),

      itemCount:
        Number(order.itemCount ?? 0),

      orderDate:
        order.createdAt ?? '',

      status:
        order.status,

      paymentStatus:
        order.paymentStatus,

      deliveryStatus:
        order.deliveryStatus,

      deliveryAddress:
        order.deliveryAddress ?? undefined,

      createdAt:
        order.createdAt ?? undefined,

      updatedAt:
        order.updatedAt ?? undefined
    };
  }
}
