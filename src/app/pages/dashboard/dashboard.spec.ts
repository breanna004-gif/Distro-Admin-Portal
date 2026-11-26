import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../services/auth';
import { AdminDashboardService } from '../../services/admin-dashboard';
import { InventoryService } from '../../services/inventory';
import { OrganizationService } from '../../services/organization';
import { UsersService } from '../../services/users';
import { ProductService } from '../../services/product';
import { TripManagementService } from '../../services/trip-management.service';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let getDashboard: ReturnType<typeof vi.fn>;
  let getTrips: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getDashboard = vi.fn(() => of({
      totalUsers: 2,
      totalProducts: 15,
      totalOrders: 30,
      pendingOrders: 5,
      totalPayments: 20,
      totalTrips: 8,
      lowStockProducts: 1
    }));
    getTrips = vi.fn(() => of([]));
    TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: AuthService, useValue: { getToken: () => 'token' } },
        { provide: AdminDashboardService, useValue: { getDashboard } },
        {
          provide: OrganizationService,
          useValue: {
            getManufacturers: () => of([{ id: 'm1' }]),
            getDistributors: () => of([{ id: 'd1' }, { id: 'd2' }])
          }
        },
        {
          provide: InventoryService,
          useValue: {
            getTotalStockUnits: () => of(17)
          }
        },
        {
          provide: UsersService,
          useValue: {
            getUserCount: () => of(2)
          }
        },
        {
          provide: ProductService,
          useValue: {
            getProducts: () => of({
              content: [],
              totalElements: 15,
              totalPages: 1
            })
          }
        },
        {
          provide: TripManagementService,
          useValue: { getTrips }
        }
      ]
    });

    component = TestBed.createComponent(Dashboard).componentInstance;
  });

  it('reflects live counts from the feature services', () => {
    component.loadDashboard();

    expect(component.totalUsers).toBe(2);
    expect(component.totalManufacturers).toBe(1);
    expect(component.totalDistributors).toBe(2);
    expect(component.totalProducts).toBe(15);
    expect(component.totalOrders).toBe(30);
    expect(component.pendingOrders).toBe(5);
    expect(component.totalPayments).toBe(20);
    expect(component.totalTrips).toBe(8);
    expect(component.lowStockProducts).toBe(1);
    expect(component.totalStockUnits).toBe(17);
    expect(component.loading).toBe(false);
    expect(component.errorMessage).toBe('');
  });

  it('keeps dashboard metrics when a directory endpoint fails', () => {
    vi.spyOn(
      TestBed.inject(OrganizationService),
      'getManufacturers'
    ).mockReturnValue(
      throwError(() => new Error('manufacturers unavailable'))
    );

    component.loadDashboard();

    expect(component.totalUsers).toBe(2);
    expect(component.totalOrders).toBe(30);
    expect(component.totalManufacturers).toBe(0);
    expect(component.totalDistributors).toBe(2);
    expect(component.errorMessage).toContain('manufacturers');
    expect(component.loading).toBe(false);
  });

  it('shows stock as unavailable without the overview warning when stock loading fails', () => {
    vi.spyOn(
      TestBed.inject(InventoryService),
      'getTotalStockUnits'
    ).mockReturnValue(
      throwError(() => new Error('stock unavailable'))
    );

    component.loadDashboard();

    expect(component.totalStockUnits).toBeNull();
    expect(component.errorMessage).toBe('');
    expect(component.loading).toBe(false);
  });

  it('shows an error when the aggregate dashboard endpoint fails', () => {
    getDashboard.mockReturnValue(
      throwError(() => new Error('overview unavailable'))
    );

    component.loadDashboard();

    expect(component.totalUsers).toBe(2);
    expect(component.errorMessage).toContain('overview');
    expect(component.loading).toBe(false);
  });

  it('uses the overview user count when the users endpoint fails', () => {
    vi.spyOn(
      TestBed.inject(UsersService),
      'getUserCount'
    ).mockReturnValue(
      throwError(() => new Error('users unavailable'))
    );

    component.loadDashboard();

    expect(component.totalUsers).toBe(2);
    expect(component.errorMessage).toContain('users');
  });

  it('falls back to the product catalog count when the overview count is missing or stale', () => {
    getDashboard.mockReturnValue(
      of({
        totalUsers: 2,
        totalProducts: 0,
        totalOrders: 30,
        pendingOrders: 5,
        totalPayments: 20,
        totalTrips: 8,
        lowStockProducts: 1
      })
    );

    component.loadDashboard();

    expect(component.totalProducts).toBe(15);
  });

  it('uses the trip records when the overview reports zero trips', () => {
    getDashboard.mockReturnValue(
      of({
        totalUsers: 2,
        totalProducts: 15,
        totalOrders: 30,
        pendingOrders: 5,
        totalPayments: 20,
        totalTrips: 0,
        lowStockProducts: 1
      })
    );
    getTrips.mockReturnValue(
      of([{ id: 'trip-1' }, { id: 'trip-2' }])
    );

    component.loadDashboard();

    expect(component.totalTrips).toBe(2);
  });

  it('does not show a false zero when both user count sources fail', () => {
    getDashboard.mockReturnValue(
      throwError(() => new Error('overview unavailable'))
    );
    vi.spyOn(
      TestBed.inject(UsersService),
      'getUserCount'
    ).mockReturnValue(
      throwError(() => new Error('users unavailable'))
    );

    component.loadDashboard();

    expect(component.totalUsers).toBeNull();
    expect(component.errorMessage).toContain('users');
  });
});
