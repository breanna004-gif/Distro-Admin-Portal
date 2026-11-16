import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PaymentsService } from '../../services/payments';
import { Payment } from '../../models/payment.model';
import { ReportColumn, ReportRow } from '../../models/report.model';
import { ReportDownload } from '../../shared/components/report-download/report-download';

@Component({
  selector: 'app-payments',
  imports: [
    FormsModule,
    DecimalPipe,
    ReportDownload
  ],
  templateUrl: './payments.html',
  styleUrl: './payments.css'
})
export class Payments implements OnInit {
  readonly reportColumns: ReportColumn[] = [
    { key: 'id', header: 'Payment ID' },
    { key: 'orderId', header: 'Order ID' },
    { key: 'customerName', header: 'Customer' },
    { key: 'organizationName', header: 'Organization' },
    { key: 'amount', header: 'Amount' },
    { key: 'currency', header: 'Currency' },
    { key: 'method', header: 'Method' },
    { key: 'status', header: 'Status' },
    { key: 'transactionReference', header: 'Transaction Reference' },
    { key: 'paymentDate', header: 'Payment Date' }
  ];

  private paymentsService = inject(PaymentsService);
  private changeDetectorRef = inject(ChangeDetectorRef);

  payments: Payment[] = [];

  get reportData(): ReportRow[] {
    return this.payments.map(payment => ({
      id: payment.id,
      orderId: payment.orderId,
      customerName: payment.customerName,
      organizationName: payment.organizationName,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      transactionReference: payment.transactionReference,
      paymentDate: payment.paymentDate ?? payment.createdAt
    }));
  }
  loading = false;
  errorMessage = '';
  searchTerm = '';
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 1;

  showViewPaymentModal = false;
  selectedPayment: Payment | null = null;
  loadingPayment = false;
  viewPaymentError = '';

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.loading = true;
    this.errorMessage = '';

    this.paymentsService
      .getPayments(
        this.currentPage,
        this.pageSize,
        this.searchTerm
      )
      .subscribe({
        next: response => {
          if (Array.isArray(response)) {
            this.payments = response;
            this.totalElements = response.length;
            this.totalPages = 1;
          } else {
            this.payments = response.content;
            this.totalElements = response.totalElements;
            this.totalPages = response.totalPages;
          }

          this.loading = false;
          this.changeDetectorRef.markForCheck();
        },
        error: error => {
          console.error('Failed to load payments:', error);
          this.payments = [];
          this.totalElements = 0;
          this.totalPages = 1;
          this.errorMessage =
            error?.error?.message ||
            'Unable to load payments. Please try again.';
          this.loading = false;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  searchPayments(): void {
    this.currentPage = 0;
    this.loadPayments();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadPayments();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadPayments();
    }
  }

  viewPayment(paymentId: string): void {
    this.viewPaymentError = '';
    this.selectedPayment = null;
    this.loadingPayment = true;
    this.showViewPaymentModal = true;

    this.paymentsService
      .getPayment(paymentId)
      .subscribe({
        next: payment => {
          this.selectedPayment = payment;
          this.loadingPayment = false;
          this.changeDetectorRef.markForCheck();
        },
        error: error => {
          console.error('Failed to load payment:', error);
          this.viewPaymentError =
            error?.error?.message ||
            'Unable to load payment details. Please try again.';
          this.loadingPayment = false;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  closeViewPaymentModal(): void {
    if (this.loadingPayment) {
      return;
    }

    this.showViewPaymentModal = false;
    this.selectedPayment = null;
    this.viewPaymentError = '';
  }

  getStatusClass(status: string): string {
    return status
      .toLowerCase()
      .replace(/_/g, '-');
  }

  getMethodClass(method: string): string {
    return method
      .toLowerCase()
      .replace(/_/g, '-');
  }

  getTotalPaymentAmount(): number {
    return this.payments.reduce(
      (total, payment) => total + payment.amount,
      0
    );
  }

  getPaidPaymentAmount(): number {
    return this.payments
      .filter(payment => payment.status === 'PAID')
      .reduce((total, payment) => total + payment.amount, 0);
  }

  getPendingPaymentAmount(): number {
    return this.payments
      .filter(payment => payment.status === 'PENDING')
      .reduce((total, payment) => total + payment.amount, 0);
  }

  getFailedPayments(): number {
    return this.payments.filter(
      payment => payment.status === 'FAILED'
    ).length;
  }

  getSuccessfulPayments(): number {
    return this.payments.filter(
      payment => payment.status === 'PAID'
    ).length;
  }

  getPendingPayments(): number {
    return this.payments.filter(
      payment => payment.status === 'PENDING'
    ).length;
  }
}
