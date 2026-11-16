export type NotificationType =
  | 'ORDER'
  | 'PAYMENT'
  | 'DELIVERY'
  | 'INVENTORY'
  | 'USER'
  | 'SECURITY'
  | 'SYSTEM'
  | 'ACCESS_REQUEST';

export type NotificationPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';

export type NotificationStatus =
  | 'READ'
  | 'UNREAD';

export interface Notification {

  id: string;

  title: string;

  message: string;

  type: NotificationType;

  priority: NotificationPriority;

  status: NotificationStatus;

  recipientId?: string;

  recipientName?: string;

  organizationName?: string;

  referenceId?: string;

  referenceType?: string;

  createdAt: string;

  readAt?: string | null;

}
