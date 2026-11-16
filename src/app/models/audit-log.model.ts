// Model used by the Audit Logs frontend.
export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  organizationId?: string;
  organizationName?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILED' | 'UNKNOWN';
  createdAt?: string;
}

// Exact structure returned by the Spring Boot backend.
export interface AuditLogResponse {
  id: number;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

// Spring Boot paginated response.
export interface AuditLogPage {
  content: AuditLogResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}