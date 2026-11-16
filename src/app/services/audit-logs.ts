import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  AuditLogPage,
  AuditLogResponse
} from '../models/audit-log.model';

@Injectable({
  providedIn: 'root'
})
export class AuditLogsService {

  private http = inject(HttpClient);

  private readonly apiUrl = '/api/v1/audit-logs';

  // Get all audit logs with pagination.
  getAuditLogs(
    page: number = 0,
    size: number = 20,
    userId?: string,
    entityType?: string,
    entityId?: string
  ): Observable<AuditLogPage> {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (userId) {
      params = params.set('userId', userId);
    }

    if (entityType) {
      params = params.set('entityType', entityType);
    }

    if (entityId) {
      params = params.set('entityId', entityId);
    }

    return this.http.get<AuditLogPage>(
      this.apiUrl,
      { params }
    );
  }

  // Get one audit log by its numeric database ID.
  getAuditLog(
    auditLogId: number
  ): Observable<AuditLogResponse> {

    return this.http.get<AuditLogResponse>(
      `${this.apiUrl}/${auditLogId}`
    );
  }

  // Get audit logs belonging to a specific user.
  getUserAuditLogs(
    userId: string,
    page: number = 0,
    size: number = 20
  ): Observable<AuditLogPage> {

    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<AuditLogPage>(
      `${this.apiUrl}/user/${userId}`,
      { params }
    );
  }

  // Get audit logs belonging to a specific organization.
  getOrganizationAuditLogs(
    organizationId: string,
    page: number = 0,
    size: number = 20
  ): Observable<AuditLogPage> {

    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<AuditLogPage>(
      `${this.apiUrl}/organization/${organizationId}`,
      { params }
    );
  }

  // Get audit logs associated with a particular resource.
  getResourceAuditLogs(
    entityType: string,
    entityId: string,
    page: number = 0,
    size: number = 20
  ): Observable<AuditLogPage> {

    const params = new HttpParams()
      .set('entityType', entityType)
      .set('entityId', entityId)
      .set('page', page)
      .set('size', size);

    return this.http.get<AuditLogPage>(
      `${this.apiUrl}/resource`,
      { params }
    );
  }
}