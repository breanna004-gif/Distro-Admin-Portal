
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuditLogsService } from '../../services/audit-logs';

import {
  AuditLog,
  AuditLogResponse
} from '../../models/audit-log.model';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    FormsModule,
    NgClass
  ],
  templateUrl: './audit-logs.html',
  styleUrl: './audit-logs.css'
})
export class AuditLogs implements OnInit {

  private auditLogsService = inject(AuditLogsService);
  private changeDetectorRef = inject(ChangeDetectorRef);

  // ==========================================
  // PAGE STATE
  // ==========================================

  auditLogs: AuditLog[] = [];

  loading = false;
  errorMessage = '';

  searchTerm = '';

  currentPage = 0;
  pageSize = 20;

  totalElements = 0;
  totalPages = 1;

  // ==========================================
  // VIEW MODAL
  // ==========================================

  showViewAuditLogModal = false;

  selectedAuditLog: AuditLog | null = null;

  loadingAuditLog = false;
  viewAuditLogError = '';

  // ==========================================
  // INITIALIZATION
  // ==========================================

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  // ==========================================
  // CONVERT BACKEND RESPONSE
  // ==========================================

  private mapBackendAuditLog(log: AuditLogResponse): AuditLog {

    const metadata = log.metadata;

    let description = 'No additional details available';

    if (metadata) {
      const metadataDescription =
        metadata['description'] ??
        metadata['message'] ??
        metadata['details'];

      description =
        typeof metadataDescription === 'string'
          ? metadataDescription
          : JSON.stringify(metadata);
    }

    return {
      id: String(log.id),

      userId: log.actorId ?? undefined,

      userName: log.actorId
        ? log.actorId
        : 'System',

      action: log.action || 'UNKNOWN',

      resourceType: log.entityType || 'UNKNOWN',

      resourceId: log.entityId ?? undefined,

      description,

      ipAddress: log.ipAddress ?? undefined,

      status: 'UNKNOWN',

      createdAt: log.createdAt
        ? new Date(log.createdAt).toLocaleString()
        : undefined
    };
  }

  // ==========================================
  // LOAD AUDIT LOGS
  // ==========================================

  loadAuditLogs(): void {

    this.loading = true;
    this.errorMessage = '';

    this.auditLogsService
      .getAuditLogs(
        this.currentPage,
        this.pageSize,
        undefined
      )
      .subscribe({

        next: (response) => {

          const backendLogs = response.content ?? [];

          const mappedLogs = backendLogs.map(
            log => this.mapBackendAuditLog(log)
          );

          this.auditLogs = this.applySearch(mappedLogs);

          this.totalElements = response.totalElements ?? 0;
          this.totalPages = Math.max(response.totalPages ?? 1, 1);

          this.loading = false;

          this.changeDetectorRef.markForCheck();
        },

        error: (error: any) => {

          console.error('Failed to load audit logs:', error);

          this.errorMessage =
            error?.error?.message ||
            'Unable to load audit logs. Please try again.';

          this.auditLogs = [];

          this.totalElements = 0;
          this.totalPages = 1;

          this.loading = false;

          this.changeDetectorRef.markForCheck();
        }

      });
  }

  // ==========================================
  // LOCAL SEARCH
  // ==========================================

  private applySearch(logs: AuditLog[]): AuditLog[] {

    let filteredLogs = [...logs];

    if (this.searchTerm.trim()) {

      const search = this.searchTerm.toLowerCase().trim();

      filteredLogs = filteredLogs.filter(log => {

        const searchableText = [
          log.id,
          log.userId,
          log.userName,
          log.userEmail,
          log.action,
          log.resourceType,
          log.resourceId,
          log.organizationName,
          log.description,
          log.ipAddress
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(search);
      });
    }

    return filteredLogs;
  }

  // ==========================================
  // SEARCH
  // ==========================================

  searchAuditLogs(): void {

    this.currentPage = 0;

    this.loadAuditLogs();
  }

  // ==========================================
  // ==========================================
  // PAGINATION
  // ==========================================

  nextPage(): void {

    if (this.currentPage < this.totalPages - 1) {

      this.currentPage++;

      this.loadAuditLogs();
    }
  }

  previousPage(): void {

    if (this.currentPage > 0) {

      this.currentPage--;

      this.loadAuditLogs();
    }
  }

  // ==========================================
  // VIEW AUDIT LOG
  // ==========================================

  viewAuditLog(auditLogId: string): void {

    this.viewAuditLogError = '';

    this.selectedAuditLog = null;

    this.loadingAuditLog = true;

    this.showViewAuditLogModal = true;

    const numericId = Number(auditLogId);

    if (!Number.isInteger(numericId) || numericId <= 0) {

      this.viewAuditLogError = 'Invalid audit log ID.';

      this.loadingAuditLog = false;

      return;
    }

    this.auditLogsService
      .getAuditLog(numericId)
      .subscribe({

        next: (auditLog: AuditLogResponse) => {

          this.selectedAuditLog =
            this.mapBackendAuditLog(auditLog);

          this.loadingAuditLog = false;

          this.changeDetectorRef.markForCheck();
        },

        error: (error: any) => {

          console.error('Failed to load audit log:', error);

          this.viewAuditLogError =
            error?.error?.message ||
            'Unable to load audit log details. Please try again.';

          this.loadingAuditLog = false;

          this.changeDetectorRef.markForCheck();
        }

      });
  }

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  closeViewAuditLogModal(): void {

    if (this.loadingAuditLog) {
      return;
    }

    this.showViewAuditLogModal = false;

    this.selectedAuditLog = null;

    this.viewAuditLogError = '';
  }

  // ==========================================
  // DISPLAY HELPERS
  // ==========================================

  getActionClass(action: string): string {

    return (action || 'unknown')
      .toLowerCase()
      .replace(/_/g, '-');
  }

  getResourceClass(resourceType: string): string {

    return (resourceType || 'unknown')
      .toLowerCase()
      .replace(/_/g, '-');
  }

  getStatusClass(status: string): string {

    return (status || 'unknown')
      .toLowerCase()
      .replace(/_/g, '-');
  }

  getActionLabel(action: string): string {

    switch (action) {

      case 'CREATE':
        return 'Create';

      case 'UPDATE':
        return 'Update';

      case 'DELETE':
        return 'Delete';

      case 'LOGIN':
        return 'Login';

      case 'LOGOUT':
        return 'Logout';

      case 'ASSIGN':
        return 'Assign';

      case 'ADJUST':
        return 'Adjust';

      default:
        return action;
    }
  }

  getResourceLabel(resourceType: string): string {

    switch (resourceType) {

      case 'USER':
        return 'User';

      case 'ORGANIZATION':
        return 'Organization';

      case 'PRODUCT':
        return 'Product';

      case 'INVENTORY':
        return 'Inventory';

      case 'ORDER':
        return 'Order';

      case 'PAYMENT':
        return 'Payment';

      case 'DELIVERY':
        return 'Delivery';

      case 'AUTHENTICATION':
        return 'Authentication';

      default:
        return resourceType;
    }
  }

  // ==========================================
  // STATISTICS
  // ==========================================

  getTotalLogs(): number {
    return this.totalElements;
  }

  getSuccessfulLogs(): number | string {

    const knownStatuses = this.auditLogs.filter(
      log => log.status !== 'UNKNOWN'
    );

    if (knownStatuses.length === 0) {
      return '—';
    }

    return knownStatuses.filter(
      log => log.status === 'SUCCESS'
    ).length;
  }

  getFailedLogs(): number | string {

    const knownStatuses = this.auditLogs.filter(
      log => log.status !== 'UNKNOWN'
    );

    if (knownStatuses.length === 0) {
      return '—';
    }

    return knownStatuses.filter(
      log => log.status === 'FAILED'
    ).length;
  }

  getTodayLogs(): number {

    const today = new Date().toDateString();

    return this.auditLogs.filter(log => {

      if (!log.createdAt) {
        return false;
      }

      return new Date(log.createdAt).toDateString() === today;

    }).length;
  }

  getLoginActivity(): number {

    return this.auditLogs.filter(log =>

      ['LOGIN', 'LOGOUT'].includes(
        log.action.toUpperCase()
      ) ||

      log.resourceType.toUpperCase() === 'AUTHENTICATION'

    ).length;
  }

}
