import {
  Component,
  OnInit,
  OnDestroy,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth';

interface OrganizationDashboardResponse {
  organizationId: string;
  organizationName: string;
  organizationType: string;

  totalUsers: number;

  totalProducts: number;
  activeProducts: number;

  totalStockUnits: number;
  lowStockProducts: number;
  pendingStockApprovals: number;

  totalOrders: number;
  pendingOrders: number;

  totalPayments: number;
  pendingPayments: number;

  totalTrips: number;
  activeTrips: number;
}

@Component({
  selector: 'app-distributor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './distributor-dashboard.html',
  styleUrl: './distributor-dashboard.css'
})
export class DistributorDashboard implements OnInit, OnDestroy {

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private readonly apiUrl =
    '/api/organization/dashboard';

  private clockInterval?: ReturnType<typeof setInterval>;

  organizationName = 'Distributor Organization';
  organizationType = 'Distributor';

  currentDate = '';
  currentTime = '';

  totalUsers = 0;

  totalProducts = 0;
  activeProducts = 0;

  totalStockUnits = 0;
  lowStockProducts = 0;
  pendingStockApprovals = 0;

  totalOrders = 0;
  pendingOrders = 0;

  totalPayments = 0;
  pendingPayments = 0;

  totalTrips = 0;
  activeTrips = 0;

  loading = false;
  errorMessage = '';

  get canManageUsers(): boolean {
    const user = this.authService.getCurrentUser();

    return !!user && [
      'SUPER_ADMIN',
      'PLATFORM_ADMIN',
      'ORGANIZATION_ADMIN',
      'DISTRIBUTOR_ADMIN'
    ].includes(user.role);
  }

  ngOnInit(): void {
    this.updateDateTime();

    this.clockInterval = setInterval(() => {
      this.updateDateTime();
    }, 1000);

    this.loadDashboard();
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private updateDateTime(): void {
    const now = new Date();

    this.currentDate = new Intl.DateTimeFormat('en-KE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(now);

    this.currentTime = new Intl.DateTimeFormat('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(now);
  }

  loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';

    const token = this.authService.getToken();

    if (!token) {
      this.loading = false;
      this.errorMessage =
        'Your session has expired. Please log in again.';
      return;
    }

    this.http
      .get<OrganizationDashboardResponse>(
        this.apiUrl,
        {
          headers: this.getHeaders()
        }
      )
      .subscribe({
        next: (response) => {

          console.log(
            'Distributor Dashboard API response:',
            response
          );

          this.organizationName =
            response.organizationName ||
            'Distributor Organization';

          this.organizationType =
            response.organizationType || 'Distributor';

          this.totalUsers =
            response.totalUsers ?? 0;

          this.totalProducts =
            response.totalProducts ?? 0;

          this.activeProducts =
            response.activeProducts ?? 0;

          this.totalStockUnits =
            response.totalStockUnits ?? 0;

          this.lowStockProducts =
            response.lowStockProducts ?? 0;

          this.pendingStockApprovals =
            response.pendingStockApprovals ?? 0;

          this.totalOrders =
            response.totalOrders ?? 0;

          this.pendingOrders =
            response.pendingOrders ?? 0;

          this.totalPayments =
            response.totalPayments ?? 0;

          this.pendingPayments =
            response.pendingPayments ?? 0;

          this.totalTrips =
            response.totalTrips ?? 0;

          this.activeTrips =
            response.activeTrips ?? 0;

          this.loading = false;
        },

        error: (error) => {

          console.error(
            'Distributor Dashboard API error:',
            error
          );

          this.loading = false;

          if (error?.status === 401) {

            this.errorMessage =
              'Your session has expired. Please log in again.';

          } else if (error?.status === 403) {

            this.errorMessage =
              'You do not have permission to view the distributor dashboard.';

          } else {

            this.errorMessage =
              'Unable to load live distributor dashboard data.';
          }
        }
      });
  }
}
