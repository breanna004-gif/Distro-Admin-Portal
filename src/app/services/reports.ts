import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {

  private http = inject(HttpClient);

  private readonly reportsUrl = '/api/v1/reports';

  private readonly analyticsUrl = '/api/v1/analytics';


  // ==========================================
  // GET REPORT OVERVIEW
  // ==========================================

  getReportOverview(
    period: string = '12_MONTHS'
  ): Observable<any> {

    const params = new HttpParams()
      .set('period', period);

    return this.http.get<any>(
      `${this.reportsUrl}/overview`,
      { params }
    );
  }


  // ==========================================
  // GET REVENUE REPORT
  // ==========================================

  getRevenueReport(
    period: string = '12_MONTHS'
  ): Observable<any> {

    const params = new HttpParams()
      .set('period', period);

    return this.http.get<any>(
      `${this.reportsUrl}/revenue`,
      { params }
    );
  }


  // ==========================================
  // GET ORDER REPORT
  // ==========================================

  getOrderReport(
    period: string = '12_MONTHS'
  ): Observable<any> {

    const params = new HttpParams()
      .set('period', period);

    return this.http.get<any>(
      `${this.reportsUrl}/orders`,
      { params }
    );
  }


  // ==========================================
  // GET PAYMENT REPORT
  // ==========================================

  getPaymentReport(
    period: string = '12_MONTHS'
  ): Observable<any> {

    const params = new HttpParams()
      .set('period', period);

    return this.http.get<any>(
      `${this.reportsUrl}/payments`,
      { params }
    );
  }


  // ==========================================
  // GET DELIVERY REPORT
  // ==========================================

  getDeliveryReport(
    period: string = '12_MONTHS'
  ): Observable<any> {

    const params = new HttpParams()
      .set('period', period);

    return this.http.get<any>(
      `${this.reportsUrl}/deliveries`,
      { params }
    );
  }


  // ==========================================
  // GET INVENTORY REPORT
  // ==========================================

  getInventoryReport(): Observable<any> {

    return this.http.get<any>(
      `${this.reportsUrl}/inventory`
    );
  }


  // ==========================================
  // GET ANALYTICS
  // ==========================================

  getAnalytics(
    period: string = '12_MONTHS'
  ): Observable<any> {

    const params = new HttpParams()
      .set('period', period);

    return this.http.get<any>(
      `${this.analyticsUrl}`,
      { params }
    );
  }


  // ==========================================
  // GET ORGANIZATION ANALYTICS
  // ==========================================

  getOrganizationAnalytics(
    period: string = '12_MONTHS'
  ): Observable<any> {

    const params = new HttpParams()
      .set('period', period);

    return this.http.get<any>(
      `${this.analyticsUrl}/organizations`,
      { params }
    );
  }

}
