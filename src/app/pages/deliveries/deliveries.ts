import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { DeliveriesService } from '../../services/deliveries';
import { Delivery } from '../../models/delivery.model';


@Component({
  selector: 'app-deliveries',
  imports: [
    FormsModule
  ],
  templateUrl: './deliveries.html',
  styleUrl: './deliveries.css'
})
export class Deliveries implements OnInit {

  private deliveriesService =
    inject(DeliveriesService);
  private changeDetectorRef =
    inject(ChangeDetectorRef);


  // ============================================================
  // DISPLAYED DELIVERIES
  // ============================================================

  deliveries: Delivery[] = [];


  // ============================================================
  // UI STATE
  // ============================================================

  loading = false;

  errorMessage = '';

  searchTerm = '';

  // ============================================================
  // PAGINATION
  // ============================================================

  currentPage = 0;

  pageSize = 20;

  totalElements = 0;

  totalPages = 1;


  // ============================================================
  // VIEW MODAL
  // ============================================================

  showViewDeliveryModal = false;

  selectedDelivery: Delivery | null = null;

  loadingDelivery = false;

  viewDeliveryError = '';


  // ============================================================
  // INITIALIZATION
  // ============================================================

  ngOnInit(): void {

    this.loadDeliveries();

  }


  // ============================================================
  // LOAD DELIVERIES
  // ============================================================

  loadDeliveries(): void {

    this.loading = true;

    this.errorMessage = '';

    this.deliveriesService
      .getDeliveries(
        this.currentPage,
        this.pageSize,
        this.searchTerm
      )
      .subscribe({

        next: (response: any) => {

          const content =
            Array.isArray(response)
              ? response
              : response?.content ?? [];

          this.deliveries = content;

          this.totalElements =
            response?.totalElements ??
            this.deliveries.length;

          this.totalPages =
            response?.totalPages ??
            1;

          this.loading = false;
          this.changeDetectorRef.markForCheck();

        },

        error: (error: any) => {

          console.error(
            'Failed to load deliveries:',
            error
          );

          this.deliveries = [];

          this.totalElements = 0;

          this.totalPages = 1;

          this.errorMessage =
            error?.error?.message ||
            'Unable to load deliveries. Please try again.';

          this.loading = false;
          this.changeDetectorRef.markForCheck();

        }

      });

  }


  // ============================================================
  // SEARCH
  // ============================================================

  searchDeliveries(): void {

    this.currentPage = 0;

    this.loadDeliveries();

  }


  // ============================================================
  // PAGINATION
  // ============================================================

  nextPage(): void {

    if (
      this.currentPage <
      this.totalPages - 1
    ) {

      this.currentPage++;

      this.loadDeliveries();

    }

  }


  previousPage(): void {

    if (this.currentPage > 0) {

      this.currentPage--;

      this.loadDeliveries();

    }

  }


  // ============================================================
  // VIEW DELIVERY
  // ============================================================

  viewDelivery(
    deliveryId: string
  ): void {

    this.viewDeliveryError = '';

    this.selectedDelivery = null;

    this.loadingDelivery = true;

    this.showViewDeliveryModal = true;


    this.deliveriesService
      .getDelivery(deliveryId)
      .subscribe({

        next: (delivery: Delivery) => {

          this.selectedDelivery =
            delivery;

          this.loadingDelivery = false;
          this.changeDetectorRef.markForCheck();

        },

        error: (error: any) => {

          console.error(
            'Failed to load delivery:',
            error
          );

          this.viewDeliveryError =
            error?.error?.message ||
            'Unable to load delivery details. Please try again.';

          this.loadingDelivery = false;
          this.changeDetectorRef.markForCheck();

        }

      });

  }


  // ============================================================
  // CLOSE VIEW MODAL
  // ============================================================

  closeViewDeliveryModal(): void {

    if (this.loadingDelivery) {
      return;
    }

    this.showViewDeliveryModal = false;

    this.selectedDelivery = null;

    this.viewDeliveryError = '';

  }


  // ============================================================
  // STATUS CLASS
  // ============================================================

  getStatusClass(
    status: string
  ): string {

    return status
      .toLowerCase()
      .replace(/\_/g, '-');

  }


  // ============================================================
  // KPI - TOTAL DELIVERIES
  // ============================================================

  getTotalDeliveries(): number {

    return this.totalElements;

  }


  // ============================================================
  // KPI - ACTIVE DELIVERIES
  // ============================================================

  getActiveDeliveries(): number {

    return this.deliveries.filter(
      delivery =>
        delivery.status !== 'DELIVERED' &&
        delivery.status !== 'CANCELLED' &&
        delivery.status !== 'FAILED'
    ).length;

  }


  // ============================================================
  // KPI - COMPLETED DELIVERIES
  // ============================================================

  getCompletedDeliveries(): number {

    return this.deliveries.filter(
      delivery =>
        delivery.status === 'DELIVERED'
    ).length;

  }


  // ============================================================
  // KPI - PENDING DELIVERIES
  // ============================================================

  getPendingDeliveries(): number {

    return this.deliveries.filter(
      delivery =>
        delivery.status === 'PENDING'
    ).length;

  }


  // ============================================================
  // KPI - FAILED DELIVERIES
  // ============================================================

  getFailedDeliveries(): number {

    return this.deliveries.filter(
      delivery =>
        delivery.status === 'FAILED'
    ).length;

  }

}