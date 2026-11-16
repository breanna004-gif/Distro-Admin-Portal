import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { finalize } from 'rxjs';
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
  selector: 'app-manufacturer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './manufacturer-dashboard.html',
  styleUrl: './manufacturer-dashboard.css'
})
export class ManufacturerDashboard implements OnInit {

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  private readonly apiUrl =
    '/api/organization/dashboard';

  currentDate = '';
  currentTime = '';

  organizationName = 'Manufacturer';

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
      'MANUFACTURER_ADMIN'
    ].includes(user.role);
  }

  ngOnInit(): void {
    this.updateDateTime();
    this.loadDashboard();
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
    console.log('Manufacturer dashboard: starting API request');

    this.loading = true;
    this.errorMessage = '';

    const token = this.authService.getToken();

    if (!token) {
      this.loading = false;
      this.errorMessage =
        'Your session has expired. Please log in again.';

      this.cdr.detectChanges();
      return;
    }

    this.http
      .get<OrganizationDashboardResponse>(
        this.apiUrl,
        {
          headers: this.getHeaders()
        }
      )
      .pipe(
        finalize(() => {
          this.loading = false;

          console.log(
            'Manufacturer dashboard: request finished, loading =',
            this.loading
          );

          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {

          console.log(
            'Manufacturer dashboard: API response',
            response
          );

          this.organizationName =
            response.organizationName || 'Manufacturer';

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

          console.log(
            'Manufacturer dashboard: data assigned successfully'
          );
        },

        error: (error) => {

          console.error(
            'Manufacturer dashboard API error:',
            error
          );

          if (error?.status === 401) {

            this.errorMessage =
              'Your session has expired. Please log in again.';

          } else if (error?.status === 403) {

            this.errorMessage =
              'You do not have permission to view this dashboard.';

          } else {

            this.errorMessage =
              'Unable to load live manufacturer dashboard data.';
          }
        }
      });
  }
}
