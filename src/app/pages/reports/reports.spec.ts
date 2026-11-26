import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { ReportsService } from '../../services/reports';
import { Reports } from './reports';

describe('Reports', () => {
  let component: Reports;
  let fixture: ComponentFixture<Reports>;
  let getReportOverview: ReturnType<typeof vi.fn>;
  let getRevenueReport: ReturnType<typeof vi.fn>;
  let getOrderReport: ReturnType<typeof vi.fn>;
  let getInventoryReport: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    getReportOverview = vi.fn(() => of({ totalRevenue: 0 }));
    getRevenueReport = vi.fn(() => of([]));
    getOrderReport = vi.fn(() => of([]));
    getInventoryReport = vi.fn(() => of({
      totalProducts: 5,
      totalUnits: 120,
      lowStockItems: 2,
      outOfStockItems: 1,
      inventoryValue: 50000
    }));

    await TestBed.configureTestingModule({
      imports: [Reports],
      providers: [{
        provide: ReportsService,
        useValue: {
          getReportOverview,
          getRevenueReport,
          getOrderReport,
          getInventoryReport
        }
      }]
    }).compileComponents();

    fixture = TestBed.createComponent(Reports);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('normalizes paged and nested report responses before updating charts', () => {
    getRevenueReport.mockReturnValue(of({
      content: [{ month: 'October', revenue: '1250' }]
    }));
    getOrderReport.mockReturnValue(of({
      data: [{ period: 'October', count: '12' }]
    }));

    component.loadReports();

    expect(component.revenueChartData.labels).toEqual(['October']);
    expect(component.revenueChartData.datasets[0].data).toEqual([1250]);
    expect(component.orderChartData.labels).toEqual(['October']);
    expect(component.orderChartData.datasets[0].data).toEqual([12]);
    expect(component.errorMessage).toBe('');
  });

  it('loads inventory values from the inventory report endpoint', () => {
    component.loadReports();

    expect(getInventoryReport).toHaveBeenCalled();
    expect(component.inventorySummary).toEqual({
      totalProducts: 5,
      totalUnits: 120,
      lowStock: 2,
      outOfStock: 1,
      inventoryValue: 50000
    });
  });

  it('shows a report error instead of throwing on an unsupported response shape', () => {
    getRevenueReport.mockReturnValue(of({
      report: 'revenue',
      organizations: 4
    }));

    expect(() => component.loadReports()).not.toThrow();
    expect(component.errorMessage).toContain('unsupported format');
    expect(component.revenueData).toEqual([]);
  });

  it('uses the aggregate report response returned by the revenue and orders APIs', () => {
    getRevenueReport.mockReturnValue(of({
      report: 'revenue',
      organizations: 4,
      users: 7,
      orders: 0,
      payments: 0,
      trips: 0,
      stockItems: 0,
      lowStockItems: 0,
      amount: 0,
      byStatus: {
        INITIATING: 0,
        PENDING: 0,
        CONFIRMED: 0,
        FAILED: 0,
        REVERSED: 0,
        RECONCILED: 0
      }
    }));
    getOrderReport.mockReturnValue(of({
      report: 'orders',
      organizations: 4,
      users: 7,
      orders: 0,
      payments: 0,
      trips: 0,
      stockItems: 0,
      lowStockItems: 0,
      amount: 0,
      byStatus: {
        PENDING: 0,
        CONFIRMED: 0,
        PROCESSING: 0
      }
    }));

    component.loadReports();

    expect(component.revenueData).toEqual([{
      month: 'Last 12 months',
      revenue: 0
    }]);
    expect(component.orderData).toEqual([{
      month: 'Last 12 months',
      orders: 0
    }]);
    expect(component.paymentStatusData).toEqual([
      { status: 'INITIATING', count: 0 },
      { status: 'PENDING', count: 0 },
      { status: 'CONFIRMED', count: 0 },
      { status: 'FAILED', count: 0 },
      { status: 'REVERSED', count: 0 },
      { status: 'RECONCILED', count: 0 }
    ]);
    expect(component.errorMessage).toBe('');
  });
});
