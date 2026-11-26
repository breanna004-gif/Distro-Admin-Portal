import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Observable,
  catchError,
  finalize,
  forkJoin,
  map,
  of
} from 'rxjs';

import { AuthService } from '../../services/auth';
import {
  AdminDashboardResponse,
  AdminDashboardService
} from '../../services/admin-dashboard';
import { InventoryService } from '../../services/inventory';
import {
  Organization,
  OrganizationService
} from '../../services/organization';
import { UsersService } from '../../services/users';
import { ProductService } from '../../services/product';
import { TripManagementService } from '../../services/trip-management.service';

interface DashboardMetrics {
  dashboard: AdminDashboardResponse | null;
  manufacturers: Organization[] | null;
  distributors: Organization[] | null;
  totalStockUnits: number | null;
  totalUsers: number | null;
  productCount: number | null;
  tripCount: number | null;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})

export class Dashboard implements OnInit {
  private changeDetectorRef = inject(ChangeDetectorRef);
  private readonly authService = inject(AuthService);
  private readonly adminDashboardService =
    inject(AdminDashboardService);
  private readonly inventoryService = inject(InventoryService);
  private readonly organizationService =
    inject(OrganizationService);
  private readonly usersService = inject(UsersService);
  private readonly productService = inject(ProductService);
  private readonly tripManagementService = inject(TripManagementService);

  currentDate = '';
  currentTime = '';

  totalUsers: number | null = null;
  totalManufacturers = 0;
  totalDistributors = 0;
  totalProducts = 0;
  totalStockUnits: number | null = null;
  totalOrders = 0;
  pendingOrders = 0;
  totalPayments = 0;
  totalTrips = 0;
  lowStockProducts = 0;

  loading = false;
  errorMessage = '';

  private failedMetrics: string[] = [];

  ngOnInit(): void {
    this.updateDateTime();
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';
    this.failedMetrics = [];

    if (!this.authService.getToken()) {
      this.loading = false;
      this.errorMessage =
        'Your session has expired. Please log in again.';
      return;
    }

    forkJoin({
      dashboard: this.withFallback(
        'overview',
        this.adminDashboardService.getDashboard()
      ),
      manufacturers: this.withFallback(
        'manufacturers',
        this.organizationService.getManufacturers()
      ),
      distributors: this.withFallback(
        'distributors',
        this.organizationService.getDistributors()
      ),
      totalStockUnits: this.withFallback(
        'stock quantities',
        this.inventoryService.getTotalStockUnits()
      ),
      totalUsers: this.withFallback(
        'users',
        this.usersService.getUserCount()
      ),
      productCount: this.withFallback(
        'product catalog',
        this.productService.getProducts(0, 1).pipe(
          map(response => response.totalElements)
        )
      ),
      tripCount: this.withFallback(
        'trips',
        this.tripManagementService.getTrips().pipe(
          map(trips => trips.length)
        )
      )
    })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.changeDetectorRef.markForCheck();
        })
      )
      .subscribe({
        next: (metrics: DashboardMetrics) => {
          this.updateMetrics(metrics);
          this.changeDetectorRef.markForCheck();

          const dashboardFailures = this.failedMetrics.filter(
            metric =>
              metric !== 'stock quantities' &&
              (metric !== 'trips' || metrics.dashboard?.totalTrips == null)
          );

          if (dashboardFailures.length > 0) {
            this.errorMessage =
              `Some overview metrics could not be loaded: ${dashboardFailures.join(', ')}.`;
          }
        },

        error: (error: unknown) => {
          console.error(
            'Failed to load dashboard metrics:',
            error
          );
          this.errorMessage =
            'Unable to load dashboard data.';
        }
        
      });
  }

  getOrderBarHeight(value: number): number {
    const maximum = Math.max(
      this.totalOrders,
      this.pendingOrders
    );

    return maximum === 0
      ? 0
      : (value / maximum) * 100;
  }

  getActivityGradient(): string {
    const values = [
      this.totalOrders,
      this.pendingOrders,
      this.totalPayments,
      this.totalTrips,
      this.lowStockProducts
    ];

    const colors = [
      '#3b82f6',
      '#22c55e',
      '#f59e0b',
      '#60a5fa',
      '#64748b'
    ];

    const total = values.reduce(
      (sum, value) => sum + value,
      0
    );

    if (total === 0) {
      return 'conic-gradient(var(--border) 0deg 360deg)';
    }

    let currentDegree = 0;

    const segments = values.map((value, index) => {
      const nextDegree =
        currentDegree + (value / total) * 360;

      const segment =
        `${colors[index]} ${currentDegree}deg ${nextDegree}deg`;

      currentDegree = nextDegree;
      return segment;
    });

    return `conic-gradient(${segments.join(', ')})`;
  }

  private withFallback<T>(
    metric: string,
    request: Observable<T>
  ): Observable<T | null> {
    return request.pipe(
      catchError((error: unknown) => {
        console.error(
          `Failed to load dashboard ${metric}:`,
          error
        );

        this.failedMetrics.push(metric);
        return of(null);
      })
    );
  }

  private updateMetrics(
    metrics: DashboardMetrics
  ): void {
    this.totalUsers =
      metrics.totalUsers ?? metrics.dashboard?.totalUsers ?? null;

    this.totalManufacturers =
      metrics.manufacturers?.length ?? 0;

    this.totalDistributors =
      metrics.distributors?.length ?? 0;

    this.totalProducts =
      (metrics.dashboard?.totalProducts ?? 0) > 0
        ? metrics.dashboard!.totalProducts
        : (metrics.productCount ?? 0);

    this.totalOrders =
      metrics.dashboard?.totalOrders ?? 0;

    this.pendingOrders =
      metrics.dashboard?.pendingOrders ?? 0;

    this.totalPayments =
      metrics.dashboard?.totalPayments ?? 0;

    this.totalTrips = Math.max(
      metrics.dashboard?.totalTrips ?? 0,
      metrics.tripCount ?? 0
    );

    this.lowStockProducts =
      metrics.dashboard?.lowStockProducts ?? 0;

    this.totalStockUnits =
      metrics.totalStockUnits;
  }

  private updateDateTime(): void {
    const now = new Date();

    this.currentDate = new Intl.DateTimeFormat(
      'en-KE',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }
    ).format(now);

    this.currentTime = new Intl.DateTimeFormat(
      'en-KE',
      {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }
    ).format(now);
  }
}
