
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  ChartConfiguration,
  ChartData,
  registerables
} from 'chart.js';
import { forkJoin, finalize } from 'rxjs';

import { ReportsService } from '../../services/reports';
import { ReportColumn, ReportRow } from '../../models/report.model';
import { ReportDownload } from '../../shared/components/report-download/report-download';

Chart.register(...registerables);

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

interface MonthlyOrders {
  month: string;
  orders: number;
}

interface StatusCount {
  status: string;
  count: number;
}

interface InventorySummary {
  totalProducts: number;
  totalUnits: number;
  lowStock: number;
  outOfStock: number;
  inventoryValue: number;
}

@Component({
  selector: 'app-reports',
  imports: [
    FormsModule,
    DecimalPipe,
    NgClass,
    BaseChartDirective,
    ReportDownload
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports implements OnInit {
  readonly reportColumns: ReportColumn[] = [
    { key: 'category', header: 'Category' },
    { key: 'metric', header: 'Metric' },
    { key: 'value', header: 'Value' },
    { key: 'period', header: 'Period' }
  ];

  private reportsService = inject(ReportsService);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  errorMessage = '';
  selectedPeriod = '12_MONTHS';

  totalRevenue = 0;
  totalOrders = 0;
  totalPayments = 0;
  totalDeliveries = 0;
  totalCustomers = 0;
  totalOrganizations = 0;
  confirmedPayments = 0;
  completedDeliveries = 0;

  revenueChange = 0;
  ordersChange = 0;
  paymentsChange = 0;
  deliveriesChange = 0;

  revenueData: MonthlyRevenue[] = [];
  orderData: MonthlyOrders[] = [];
  paymentStatusData: StatusCount[] = [];
  deliveryStatusData: StatusCount[] = [];
  revenueChartType: 'line' = 'line';

  revenueChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      label: 'Revenue (KES)',
      data: [],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.18)',
      fill: true,
      tension: 0.35
    }]
  };

  revenueChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#cbd5e1' }
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(148, 163, 184, 0.1)' }
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(148, 163, 184, 0.1)' }
      }
    }
  };

  orderChartType: 'bar' = 'bar';

  orderChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Orders',
      data: [],
      backgroundColor: '#8b5cf6',
      borderRadius: 5
    }]
  };

  orderChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#cbd5e1' }
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#94a3b8', precision: 0 },
        grid: { color: 'rgba(148, 163, 184, 0.1)' }
      }
    }
  };

  inventorySummary: InventorySummary = {
    totalProducts: 0,
    totalUnits: 0,
    lowStock: 0,
    outOfStock: 0,
    inventoryValue: 0
  };

  get reportData(): ReportRow[] {
    const period = this.getPeriodLabel();
    const rows: ReportRow[] = [
      { category: 'Overview', metric: 'Total Revenue (KES)', value: this.totalRevenue, period },
      { category: 'Overview', metric: 'Total Orders', value: this.totalOrders, period },
      { category: 'Overview', metric: 'Total Payments', value: this.totalPayments, period },
      { category: 'Overview', metric: 'Total Deliveries', value: this.totalDeliveries, period },
      { category: 'Overview', metric: 'Total Customers', value: this.totalCustomers, period },
      { category: 'Overview', metric: 'Active Organizations', value: this.totalOrganizations, period },
      { category: 'Payments', metric: 'Confirmed Payments', value: this.confirmedPayments, period },
      { category: 'Deliveries', metric: 'Completed Deliveries', value: this.completedDeliveries, period },
      { category: 'Inventory', metric: 'Total Products', value: this.inventorySummary.totalProducts, period },
      { category: 'Inventory', metric: 'Total Units', value: this.inventorySummary.totalUnits, period },
      { category: 'Inventory', metric: 'Low Stock Items', value: this.inventorySummary.lowStock, period },
      { category: 'Inventory', metric: 'Out of Stock Items', value: this.inventorySummary.outOfStock, period },
      { category: 'Inventory', metric: 'Inventory Value (KES)', value: this.inventorySummary.inventoryValue, period },
      ...this.revenueData.map(item => ({
        category: 'Revenue',
        metric: item.month,
        value: item.revenue,
        period
      })),
      ...this.orderData.map(item => ({
        category: 'Orders',
        metric: item.month,
        value: item.orders,
        period
      })),
      ...this.paymentStatusData.map(item => ({
        category: 'Payment Status',
        metric: item.status,
        value: item.count,
        period
      })),
      ...this.deliveryStatusData.map(item => ({
        category: 'Delivery Status',
        metric: item.status,
        value: item.count,
        period
      }))
    ];

    return rows;
  }

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    forkJoin({
      overview: this.reportsService.getReportOverview(this.selectedPeriod),
      revenue: this.reportsService.getRevenueReport(this.selectedPeriod),
      orders: this.reportsService.getOrderReport(this.selectedPeriod)
    })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (result) => {
          try {
            const revenue = this.normalizeMonthlySeries(
              result.revenue,
              'revenue'
            );
            const orders = this.normalizeMonthlySeries(
              result.orders,
              'orders'
            );

            this.applyReportResponse(result.overview);

            this.revenueData = revenue;
            this.orderData = orders;
            this.paymentStatusData = this.normalizeStatusCounts(
              result.revenue
            );

            this.revenueChartData = {
              labels: revenue.map(item => item.month),
              datasets: [{
                label: 'Revenue (KES)',
                data: revenue.map(item => item.revenue),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.18)',
                fill: true,
                tension: 0.35
              }]
            };

            this.orderChartData = {
              labels: orders.map(item => item.month),
              datasets: [{
                label: 'Orders',
                data: orders.map(item => item.orders),
                backgroundColor: '#8b5cf6',
                borderRadius: 5
              }]
            };

            this.cdr.detectChanges();
          } catch (error) {
            console.error('[Reports] Invalid report response:', error);
            this.errorMessage =
              'The report data was returned in an unsupported format.';
            this.revenueData = [];
            this.orderData = [];
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error('[Reports] Failed to load reports:', error);
          this.errorMessage = 'Failed to load reports. Please try again.';
          this.cdr.detectChanges();
        }
      });
  }

  private normalizeMonthlySeries(
    response: unknown,
    metric: 'revenue'
  ): MonthlyRevenue[];
  private normalizeMonthlySeries(
    response: unknown,
    metric: 'orders'
  ): MonthlyOrders[];
  private normalizeMonthlySeries(
    response: unknown,
    metric: 'revenue' | 'orders'
  ): Array<MonthlyRevenue | MonthlyOrders> {
    const aggregate = this.readAggregate(response, metric);
    if (aggregate !== null) {
      return metric === 'revenue'
        ? [{ month: this.getPeriodLabel(), revenue: aggregate }]
        : [{ month: this.getPeriodLabel(), orders: aggregate }];
    }

    const candidates = metric === 'revenue'
      ? ['revenue', 'monthlyRevenue', 'revenueData']
      : ['orders', 'monthlyOrders', 'orderData'];
    const rows = this.findSeriesRows(response, candidates);

    return rows.map((row, index) => {
      if (typeof row !== 'object' || row === null) {
        throw new TypeError(`Invalid ${metric} report row at index ${index}.`);
      }

      const record = row as Record<string, unknown>;
      const month = record['month'] ?? record['period'] ??
        record['label'] ?? record['date'] ?? `Period ${index + 1}`;
      const value = metric === 'revenue'
        ? record['revenue'] ?? record['amount'] ?? record['totalRevenue'] ??
          record['value']
        : record['orders'] ?? record['count'] ?? record['totalOrders'] ??
          record['value'];
      const numericValue = Number(value);

      if (value === undefined || value === null || !Number.isFinite(numericValue)) {
        throw new TypeError(`Invalid ${metric} value at index ${index}.`);
      }

      return metric === 'revenue'
        ? { month: String(month), revenue: numericValue }
        : { month: String(month), orders: numericValue };
    });
  }

  private readAggregate(
    response: unknown,
    metric: 'revenue' | 'orders'
  ): number | null {
    if (typeof response !== 'object' || response === null) {
      return null;
    }

    const record = response as Record<string, unknown>;
    const value = metric === 'revenue'
      ? record['amount'] ?? record['totalRevenue']
      : record['orders'] ?? record['totalOrders'];

    if (value === undefined || value === null || value === '') {
      return null;
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      throw new TypeError(`Invalid ${metric} aggregate value.`);
    }

    return numericValue;
  }

  private normalizeStatusCounts(response: unknown): StatusCount[] {
    if (typeof response !== 'object' || response === null) {
      return [];
    }

    const byStatus = (response as Record<string, unknown>)['byStatus'];
    if (typeof byStatus !== 'object' || byStatus === null || Array.isArray(byStatus)) {
      return [];
    }

    return Object.entries(byStatus as Record<string, unknown>)
      .map(([status, value]) => ({
        status,
        count: Number(value)
      }))
      .filter(item => Number.isFinite(item.count));
  }

  private findSeriesRows(
    response: unknown,
    seriesKeys: string[],
    depth = 0
  ): unknown[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (typeof response !== 'object' || response === null || depth > 3) {
      throw new TypeError('Expected report data to contain a list of records.');
    }

    const record = response as Record<string, unknown>;
    const keys = [
      ...seriesKeys,
      'content',
      'items',
      'records',
      'results',
      'data'
    ];

    for (const key of keys) {
      if (Array.isArray(record[key])) {
        return record[key];
      }
    }

    for (const key of keys) {
      const nested = record[key];
      if (
        typeof nested === 'object' &&
        nested !== null &&
        keys.some(nestedKey =>
          (nested as Record<string, unknown>)[nestedKey] !== undefined
        )
      ) {
        return this.findSeriesRows(nested, seriesKeys, depth + 1);
      }
    }

    if (
      typeof record['month'] === 'string' ||
      typeof record['period'] === 'string' ||
      typeof record['label'] === 'string'
    ) {
      return [record];
    }

    throw new TypeError('Expected report data to contain a list of records.');
  }

  changePeriod(): void {
    this.loadReports();
  }

  applyReportResponse(response: any): void {
    this.totalRevenue = Number(response.totalRevenue ?? 0);
    this.totalOrders = Number(response.totalOrders ?? 0);
    this.totalPayments = Number(response.totalPayments ?? 0);
    this.confirmedPayments = Number(response.confirmedPayments ?? 0);
    this.totalDeliveries = Number(response.totalDeliveries ?? 0);
    this.completedDeliveries = Number(response.completedDeliveries ?? 0);
    this.totalCustomers = Number(response.totalCustomers ?? 0);
    this.totalOrganizations = Number(response.totalOrganizations ?? 0);

    this.inventorySummary = {
      totalProducts: Number(response.totalStockItems ?? 0),
      totalUnits: Number(response.totalUnits ?? 0),
      lowStock: Number(response.lowStockItems ?? 0),
      outOfStock: Number(response.outOfStockItems ?? 0),
      inventoryValue: Number(response.inventoryValue ?? 0)
    };
  }

  getAverageOrderValue(): number {
    return this.totalOrders > 0
      ? this.totalRevenue / this.totalOrders
      : 0;
  }

  getDeliverySuccessRate(): number {
    return this.totalDeliveries > 0
      ? (this.completedDeliveries / this.totalDeliveries) * 100
      : 0;
  }

  getPaymentSuccessRate(): number {
    return this.totalPayments > 0
      ? (this.confirmedPayments / this.totalPayments) * 100
      : 0;
  }

  getMaximumRevenue(): number {
    return Math.max(0, ...this.revenueData.map(item => item.revenue));
  }

  getMaximumOrders(): number {
    return Math.max(0, ...this.orderData.map(item => item.orders));
  }

  getRevenueBarHeight(revenue: number): number {
    const maximum = this.getMaximumRevenue();
    return maximum > 0 ? (revenue / maximum) * 100 : 0;
  }

  getOrderBarHeight(orders: number): number {
    const maximum = this.getMaximumOrders();
    return maximum > 0 ? (orders / maximum) * 100 : 0;
  }

  getPaymentPercentage(count: number): number {
    const total = this.paymentStatusData.reduce(
      (sum, item) => sum + item.count,
      0
    );
    return total > 0 ? (count / total) * 100 : 0;
  }

  getDeliveryPercentage(count: number): number {
    const total = this.deliveryStatusData.reduce(
      (sum, item) => sum + item.count,
      0
    );
    return total > 0 ? (count / total) * 100 : 0;
  }

  getPeriodLabel(): string {
    switch (this.selectedPeriod) {
      case '7_DAYS': return 'Last 7 days';
      case '30_DAYS': return 'Last 30 days';
      case '3_MONTHS': return 'Last 3 months';
      case '6_MONTHS': return 'Last 6 months';
      case '12_MONTHS': return 'Last 12 months';
      default: return 'Last 12 months';
    }
  }

  getPaymentStatusClass(status: string): string {
    return status.toLowerCase().replace(/_/g, '-');
  }

  getDeliveryStatusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }
}
