import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  DecimalPipe,
  NgClass
} from '@angular/common';

import { FormsModule } from '@angular/forms';

import {
  OrdersService,
  OrderStatsResponse
} from '../../services/orders';

import { Order } from '../../models/order.model';
import { ReportColumn, ReportRow } from '../../models/report.model';
import { ReportDownload } from '../../shared/components/report-download/report-download';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    FormsModule,
    DecimalPipe,
    NgClass,
    ReportDownload
  ],
  templateUrl: './orders.html',
  styleUrl: './orders.css'
})
export class Orders implements OnInit {
  readonly reportColumns: ReportColumn[] = [
    { key: 'orderNumber', header: 'Order Number' },
    { key: 'customerName', header: 'Customer' },
    { key: 'customerEmail', header: 'Customer Email' },
    { key: 'organizationName', header: 'Organization' },
    { key: 'itemCount', header: 'Items' },
    { key: 'totalAmount', header: 'Total Amount' },
    { key: 'status', header: 'Order Status' },
    { key: 'paymentStatus', header: 'Payment Status' },
    { key: 'deliveryStatus', header: 'Delivery Status' },
    { key: 'orderDate', header: 'Order Date' }
  ];

  private ordersService = inject(OrdersService);
  private changeDetectorRef = inject(ChangeDetectorRef);

  // ==========================================
  // DISPLAYED ORDERS
  // ==========================================

  orders: Order[] = [];

  get reportData(): ReportRow[] {
    return this.orders.map(order => ({
      orderNumber: order.orderNumber ?? order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      organizationName: order.organizationName,
      itemCount: order.itemCount,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      deliveryStatus: order.deliveryStatus,
      orderDate: order.orderDate
    }));
  }

  // ==========================================
  // ORDER STATISTICS
  // ==========================================

  totalOrders = 0;

  activeOrders = 0;

  pendingOrders = 0;

  totalOrderValue = 0;

  // ==========================================
  // UI STATE
  // ==========================================

  loading = false;

  errorMessage = '';

  searchTerm = '';

  // ==========================================
  // PAGINATION
  // ==========================================

  currentPage = 0;

  pageSize = 20;

  totalElements = 0;

  totalPages = 1;

  // ==========================================
  // VIEW MODAL
  // ==========================================

  showViewOrderModal = false;

  selectedOrder: Order | null = null;

  loadingOrder = false;

  viewOrderError = '';

  // ==========================================
  // INITIALIZATION
  // ==========================================

  ngOnInit(): void {

    this.loadOrders();

    this.loadOrderStats();

  }

  // ==========================================
  // LOAD ORDERS
  // ==========================================

  loadOrders(): void {

    this.loading = true;

    this.errorMessage = '';

    this.ordersService
      .getOrders(
        this.currentPage,
        this.pageSize,
        this.searchTerm
      )
      .subscribe({

        next: (response) => {

          this.orders =
            (response.content ?? []).map(order =>
              this.ordersService.mapOrder(order)
            );

          this.totalElements =
            response.totalElements ??
            this.orders.length;

          this.totalPages =
            response.totalPages ?? 1;

          this.loading = false;
          this.changeDetectorRef.markForCheck();

        },

        error: (error) => {

          console.error(
            'Failed to load orders:',
            error
          );

          this.orders = [];

          this.totalElements = 0;

          this.totalPages = 1;

          this.loading = false;

          if (error?.status === 401) {

            this.errorMessage =
              'Your session has expired. Please log in again.';

          } else if (error?.status === 403) {

            this.errorMessage =
              'You do not have permission to view orders.';

          } else {

            this.errorMessage =
              'Unable to load orders. Please try again.';

          }
          this.changeDetectorRef.markForCheck();

        }

      });

  }

  // ==========================================
  // LOAD ORDER STATISTICS
  // ==========================================

  loadOrderStats(): void {

    this.ordersService
      .getOrderStats()
      .subscribe({

        next: (stats: OrderStatsResponse) => {

          this.totalOrders =
            stats.totalOrders ?? 0;

          this.activeOrders =
            stats.activeOrders ?? 0;

          this.pendingOrders =
            stats.pendingOrders ?? 0;

          this.totalOrderValue =
            Number(stats.totalOrderValue ?? 0);
          this.changeDetectorRef.markForCheck();

        },

        error: (error) => {

          console.error(
            'Failed to load order statistics:',
            error
          );

          this.totalOrders = 0;

          this.activeOrders = 0;

          this.pendingOrders = 0;

          this.totalOrderValue = 0;
          this.changeDetectorRef.markForCheck();

        }

      });

  }

  // ==========================================
  // SEARCH
  // ==========================================

  searchOrders(): void {

    this.currentPage = 0;

    this.loadOrders();

  }

  // ==========================================
  // ==========================================
  // PAGINATION
  // ==========================================

  nextPage(): void {

    if (
      this.currentPage <
      this.totalPages - 1
    ) {

      this.currentPage++;

      this.loadOrders();

    }

  }

  previousPage(): void {

    if (this.currentPage > 0) {

      this.currentPage--;

      this.loadOrders();

    }

  }

  // ==========================================
  // TOTAL ORDER VALUE
  // ==========================================

  getTotalOrderValue(): number {

    return this.totalOrderValue;

  }

  // ==========================================
  // VIEW ORDER
  // ==========================================

  viewOrder(
    orderId: string
  ): void {

    this.viewOrderError = '';

    this.selectedOrder = null;

    this.loadingOrder = true;

    this.showViewOrderModal = true;

    this.ordersService
      .getOrder(orderId)
      .subscribe({

        next: (order: Order) => {

          this.selectedOrder = order;

          this.loadingOrder = false;
          this.changeDetectorRef.markForCheck();

        },

        error: (error: any) => {

          console.error(
            'Failed to load order:',
            error
          );

          this.viewOrderError =
            error?.error?.message ||
            'Unable to load order details. Please try again.';

          this.loadingOrder = false;
          this.changeDetectorRef.markForCheck();

        }

      });

  }

  // ==========================================
  // CLOSE VIEW MODAL
  // ==========================================

  closeViewOrderModal(): void {

    if (this.loadingOrder) {

      return;

    }

    this.showViewOrderModal = false;

    this.selectedOrder = null;

    this.viewOrderError = '';

  }

  // ==========================================
  // ORDER STATUS CLASS
  // ==========================================

  getStatusClass(
    status: string
  ): string {

    return status
      .toLowerCase()
      .replace(/_/g, '-');

  }

  // ==========================================
  // PAYMENT STATUS CLASS
  // ==========================================

  getPaymentStatusClass(
    status: string
  ): string {

    return status
      .toLowerCase()
      .replace(/_/g, '-');

  }

}
