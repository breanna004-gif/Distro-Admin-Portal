import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  NotificationsService
} from '../../services/notifications';

import {
  Notification
} from '../../models/notification.model';


@Component({

  selector: 'app-notifications',

  imports: [
    FormsModule
  ],

  templateUrl: './notifications.html',

  styleUrl: './notifications.css'

})
export class Notifications implements OnInit {

  private notificationsService =
    inject(NotificationsService);
  private changeDetectorRef =
    inject(ChangeDetectorRef);


  // ============================================================
  // PAGE DATA
  // ============================================================

  private allNotifications:
    Notification[] = [];

  notifications:
    Notification[] = [];


  // ============================================================
  // STATE
  // ============================================================

  loading = false;

  errorMessage = '';

  searchTerm = '';

  currentPage = 0;

  pageSize = 20;

  totalElements = 0;

  totalPages = 1;


  // ============================================================
  // VIEW MODAL
  // ============================================================

  showViewNotificationModal = false;

  selectedNotification:
    Notification | null = null;

  loadingNotification = false;

  viewNotificationError = '';

  actionLoading = false;
  actionError = '';
  actionSuccess = '';
  accessRequestApproved = false;
  private accessRequestStatuses = new Map<string, string>();

  // ============================================================
  // INITIALIZE
  // ============================================================

  ngOnInit(): void {

    this.loadNotifications();

  }

  private loadAccessRequestStatuses(): void {
    const requestIds = new Set(
      this.allNotifications
        .filter(notification =>
          notification.type === 'ACCESS_REQUEST' &&
          Boolean(notification.referenceId)
        )
        .map(notification => notification.referenceId as string)
    );

    requestIds.forEach(requestId => {
      this.notificationsService
        .getAccessRequest(requestId)
        .subscribe({
          next: response => {
            const status = this.readAccessRequestStatus(response);
            if (status) {
              this.accessRequestStatuses.set(requestId, status);
              if (this.selectedNotification?.referenceId === requestId) {
                this.accessRequestApproved = status === 'APPROVED';
              }
              this.changeDetectorRef.markForCheck();
            }
          },
          error: error => {
            console.error(
              `Failed to load access request ${requestId}:`,
              error
            );
          }
        });
    });
  }

  private readAccessRequestStatus(response: unknown): string | null {
    if (typeof response !== 'object' || response === null) {
      return null;
    }

    const result = response as Record<string, unknown>;
    const nested =
      typeof result['data'] === 'object' && result['data'] !== null
        ? result['data'] as Record<string, unknown>
        : typeof result['accessRequest'] === 'object' &&
            result['accessRequest'] !== null
          ? result['accessRequest'] as Record<string, unknown>
        : typeof result['content'] === 'object' &&
            result['content'] !== null
          ? result['content'] as Record<string, unknown>
        : null;
    const status = result['status'] ?? nested?.['status'];

    return typeof status === 'string'
      ? status.toUpperCase()
      : null;
  }

  isAccessRequestApproved(notification: Notification): boolean {
    return notification.type === 'ACCESS_REQUEST' &&
      notification.referenceId !== undefined &&
      this.accessRequestStatuses.get(notification.referenceId) === 'APPROVED';
  }


  // ============================================================
  // LOAD NOTIFICATIONS FROM DATABASE
  // ============================================================

  loadNotifications(): void {

  this.loading = true;
  this.errorMessage = '';

  this.notificationsService
    .getNotifications()
    .subscribe({

      next: (notifications) => {

        console.log(
          'Notifications API response:',
          notifications
        );

        try {

          this.allNotifications =
            Array.isArray(notifications)
              ? notifications
              : ((notifications as any).content ?? []);

          this.accessRequestStatuses.clear();
          this.loadAccessRequestStatuses();
          this.currentPage = 0;

          this.applyFilters();

        } catch (error) {

          console.error(
            'Error processing notifications:',
            error
          );

          this.allNotifications = [];
          this.notifications = [];
          this.totalElements = 0;
          this.totalPages = 1;

          this.errorMessage =
            'Notifications were loaded, but could not be displayed.';

        } finally {

          this.loading = false;
          this.changeDetectorRef.markForCheck();

        }

      },

      error: (error) => {

        console.error(
          'Failed to load notifications:',
          error
        );

        this.allNotifications = [];
        this.notifications = [];
        this.totalElements = 0;
        this.totalPages = 1;

        this.errorMessage =
          'Unable to load notifications. Please try again.';

        this.loading = false;
        this.changeDetectorRef.markForCheck();

      }

    });

}
  // ============================================================
  // FILTER + SEARCH + PAGINATION
  // ============================================================

  private applyFilters(): void {

    let filtered =
      [...this.allNotifications];


    // SEARCH
    const search =
      this.searchTerm
        .trim()
        .toLowerCase();


    if (search) {

      filtered =
        filtered.filter(
          notification =>

            notification.id
              .toLowerCase()
              .includes(search)

            ||

            notification.title
              .toLowerCase()
              .includes(search)

            ||

            notification.message
              .toLowerCase()
              .includes(search)

            ||

            notification.type
              .toLowerCase()
              .includes(search)

            ||

            notification.priority
              .toLowerCase()
              .includes(search)

            ||

            (
              notification.organizationName
              ?? ''
            )
              .toLowerCase()
              .includes(search)

            ||

            (
              notification.referenceId
              ?? ''
            )
              .toLowerCase()
              .includes(search)

        );

    }


    // TOTALS
    this.totalElements =
      filtered.length;


    this.totalPages =
      Math.max(
        1,
        Math.ceil(
          filtered.length /
          this.pageSize
        )
      );


    // KEEP CURRENT PAGE VALID
    if (
      this.currentPage >=
      this.totalPages
    ) {

      this.currentPage =
        this.totalPages - 1;

    }


    // PAGINATE
    const start =
      this.currentPage *
      this.pageSize;

    const end =
      start +
      this.pageSize;

    this.notifications =
      filtered.slice(
        start,
        end
      );

  }


  // ============================================================
  // SEARCH
  // ============================================================

  searchNotifications(): void {

    this.currentPage = 0;

    this.applyFilters();

  }


  // ============================================================
  // ============================================================
  // PAGINATION
  // ============================================================

  nextPage(): void {

    if (
      this.currentPage <
      this.totalPages - 1
    ) {

      this.currentPage++;

      this.applyFilters();

    }

  }


  previousPage(): void {

    if (
      this.currentPage > 0
    ) {

      this.currentPage--;

      this.applyFilters();

    }

  }


  // ============================================================
  // VIEW NOTIFICATION
  // ============================================================

 viewNotification(
  notificationId: string
): void {

  this.viewNotificationError = '';

  this.loadingNotification = false;

  // The notification is already loaded in the page.
  // There is no need to call the API again.
  const notification =
    this.allNotifications.find(
      item =>
        item.id === notificationId
    );


  if (!notification) {

    this.viewNotificationError =
      'Notification could not be found. Please refresh the page.';

    this.selectedNotification =
      null;

    this.showViewNotificationModal =
      true;

    return;

  }


  // Display immediately.
  this.selectedNotification =
    notification;

  this.actionError = '';
  this.actionSuccess = '';
  this.accessRequestApproved = this.isAccessRequestApproved(notification);

  this.showViewNotificationModal =
    true;


  // Mark it as read in the background.
  if (
    notification.status === 'UNREAD'
  ) {

    this.markAsRead(
      notification.id
    );

  }

}


  // ============================================================
  // MARK AS READ
  // ============================================================

  markAsRead(
    notificationId: string
  ): void {

    this.notificationsService
      .markAsRead(notificationId)
      .subscribe({

        next: () => {

          this.updateLocalStatus(
            notificationId
          );
          this.changeDetectorRef.markForCheck();

        },

        error: (error) => {

          console.error(
            'Failed to mark notification as read:',
            error
          );
          this.changeDetectorRef.markForCheck();

        }

      });

  }


  // ============================================================
  // MARK ALL AS READ
  // ============================================================

  markAllAsRead(): void {

    this.notificationsService
      .markAllAsRead()
      .subscribe({

        next: () => {

          this.allNotifications =
            this.allNotifications.map(
              notification => ({

                ...notification,

                status: 'READ',

                readAt:
                  notification.readAt
                  ?? new Date().toISOString()

              })
            );


          if (
            this.selectedNotification
          ) {

            this.selectedNotification = {

              ...this.selectedNotification,

              status: 'READ',

              readAt:
                this.selectedNotification.readAt
                ?? new Date().toISOString()

            };

          }


          this.applyFilters();
          this.changeDetectorRef.markForCheck();

        },

        error: (error) => {

          console.error(
            'Failed to mark all notifications as read:',
            error
          );
          this.changeDetectorRef.markForCheck();

        }

      });

  }


  // ============================================================
  // UPDATE LOCAL STATUS
  // ============================================================

  private updateLocalStatus(
    notificationId: string
  ): void {

    const readAt =
      new Date().toISOString();


    this.allNotifications =
      this.allNotifications.map(
        notification =>

          notification.id ===
          notificationId

            ? {

                ...notification,

                status: 'READ',

                readAt

              }

            : notification

      );


    this.notifications =
      this.notifications.map(
        notification =>

          notification.id ===
          notificationId

            ? {

                ...notification,

                status: 'READ',

                readAt

              }

            : notification

      );


    if (
      this.selectedNotification?.id ===
      notificationId
    ) {

      this.selectedNotification = {

        ...this.selectedNotification,

        status: 'READ',

        readAt

      };

    }

  }

// ============================================================
// APPROVE ACCESS REQUEST
// ============================================================

approveAccessRequest(): void {
  if (!this.selectedNotification?.referenceId) {
    this.actionError = 'Access request reference is missing.';
    return;
  }

  this.actionLoading = true;
  this.actionError = '';
  this.actionSuccess = '';

  this.notificationsService
    .approveAccessRequest(this.selectedNotification.referenceId)
    .subscribe({
      next: (response: unknown) => {
        this.actionLoading = false;
        this.accessRequestApproved = true;
        this.accessRequestStatuses.set(
          this.selectedNotification?.referenceId ?? '',
          'APPROVED'
        );
        this.actionSuccess =
          this.isAlreadyApprovedMessage(response)
            ? 'This user has already been approved.'
            : 'User approved successfully.';
        this.changeDetectorRef.markForCheck();
      },

      error: (error: unknown) => {
        console.error(
          'Failed to approve access request:',
          error
        );

        this.actionLoading = false;

        if (this.isAlreadyApproved(error)) {
          this.accessRequestApproved = true;
          this.actionSuccess = 'This user has already been approved.';
        } else {
          this.actionError = this.getErrorMessage(error) ||
            'Unable to approve the access request. Please try again.';
        }
        this.changeDetectorRef.markForCheck();
      }
    });
}

private isAlreadyApprovedMessage(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const response = value as Record<string, unknown>;
  const message = response['message'];

  return typeof message === 'string' &&
    /already(?:\s+been)?\s+approved/i.test(message);
}

private isAlreadyApproved(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const response = value as Record<string, unknown>;
  const nestedError =
    typeof response['error'] === 'object' && response['error'] !== null
      ? response['error'] as Record<string, unknown>
      : null;
  const status = response['status'] ?? nestedError?.['status'];
  const message = response['message'] ?? nestedError?.['message'];

  return (
    (typeof status === 'string' && status.toUpperCase() === 'APPROVED') ||
    (typeof message === 'string' &&
      /already(?:\s+been)?\s+approved/i.test(message))
  );
}

private getErrorMessage(error: unknown): string {
  if (typeof error !== 'object' || error === null) {
    return '';
  }

  const response = error as Record<string, unknown>;
  const body =
    typeof response['error'] === 'object' && response['error'] !== null
      ? response['error'] as Record<string, unknown>
      : null;

  return typeof body?.['message'] === 'string'
    ? body['message']
    : '';
}


// ============================================================
// REJECT ACCESS REQUEST
// ============================================================

rejectAccessRequest(): void {
  if (!this.selectedNotification?.referenceId) {
    this.actionError = 'Access request reference is missing.';
    return;
  }

  this.actionLoading = true;
  this.actionError = '';

  this.notificationsService
    .rejectAccessRequest(this.selectedNotification.referenceId)
    .subscribe({
      next: () => {
        this.actionLoading = false;

        this.showViewNotificationModal = false;
        this.selectedNotification = null;

        this.loadNotifications();
        this.changeDetectorRef.markForCheck();
      },

      error: (error: any) => {
        console.error(
          'Failed to reject access request:',
          error
        );

        this.actionLoading = false;

        this.actionError =
          error?.error?.message ||
          'Unable to reject the access request. Please try again.';
        this.changeDetectorRef.markForCheck();
      }
    });
}


resendAccessRequestActivation(): void {
  const requestId = this.selectedNotification?.referenceId;

  if (!requestId) {
    this.actionError = 'Access request reference is missing.';
    return;
  }

  this.actionLoading = true;
  this.actionError = '';
  this.actionSuccess = '';

  this.notificationsService
    .resendAccessRequestActivation(requestId)
    .subscribe({
      next: () => {
        this.actionLoading = false;
        this.actionSuccess = 'Activation link resent successfully.';
        this.changeDetectorRef.markForCheck();
      },
      error: (error: any) => {
        console.error('Failed to resend activation link:', error);

        this.actionLoading = false;
        this.actionError =
          error?.error?.message ||
          'Unable to resend the activation link. Please try again.';
        this.changeDetectorRef.markForCheck();
      }
    });
}

  // ============================================================
  // CLOSE MODAL
  // ============================================================

 closeViewNotificationModal(): void {
  if (this.loadingNotification || this.actionLoading) {
    return;
  }

  this.showViewNotificationModal = false;
  this.selectedNotification = null;
  this.viewNotificationError = '';
  this.actionError = '';
  this.actionSuccess = '';
  this.accessRequestApproved = false;
}


  // ============================================================
  // STATISTICS
  // ============================================================

  getTotalNotificationCount(): number {

    return this.allNotifications.length;

  }


  getUnreadCount(): number {

    return this.allNotifications
      .filter(
        notification =>
          notification.status ===
          'UNREAD'
      )
      .length;

  }


  getHighPriorityCount(): number {

    return this.allNotifications
      .filter(
        notification =>
          notification.priority ===
            'HIGH'
          ||
          notification.priority ===
            'CRITICAL'
      )
      .length;

  }


  getTodayCount(): number {

    const today =
      new Date();


    return this.allNotifications
      .filter(notification => {

        const created =
          new Date(
            notification.createdAt
          );


        return (

          created.getFullYear() ===
          today.getFullYear()

          &&

          created.getMonth() ===
          today.getMonth()

          &&

          created.getDate() ===
          today.getDate()

        );

      })
      .length;

  }


  // ============================================================
  // CSS HELPERS
  // ============================================================

  getStatusClass(
    status: string
  ): string {

    return status
      .toLowerCase()
      .replace(/_/g, '-');

  }


  getTypeClass(
    type: string
  ): string {

    return type
      .toLowerCase()
      .replace(/_/g, '-');

  }


  getPriorityClass(
    priority: string
  ): string {

    return priority
      .toLowerCase()
      .replace(/_/g, '-');

  }


  // ============================================================
  // TYPE LABEL
  // ============================================================

  getTypeLabel(
    type: string
  ): string {

    switch (type) {

      case 'ORDER':
        return 'Order';

      case 'PAYMENT':
        return 'Payment';

      case 'DELIVERY':
        return 'Delivery';

      case 'INVENTORY':
        return 'Inventory';

      case 'USER':
        return 'User';

      case 'SECURITY':
        return 'Security';

      case 'SYSTEM':
        return 'System';

      case 'ACCESS_REQUEST':
        return 'Access Request';

      default:
        return type
          .replace(/_/g, ' ')
          .toLowerCase()
          .replace(/\b\w/g, letter =>
            letter.toUpperCase()
          );

    }

  }


  // ============================================================
  // PRIORITY LABEL
  // ============================================================

  getPriorityLabel(
    priority: string
  ): string {

    switch (priority) {

      case 'LOW':
        return 'Low';

      case 'MEDIUM':
        return 'Medium';

      case 'HIGH':
        return 'High';

      case 'CRITICAL':
        return 'Critical';

      default:
        return priority
          .replace(/_/g, ' ')
          .toLowerCase()
          .replace(/\b\w/g, letter =>
            letter.toUpperCase()
          );

    }

  }


  // ============================================================
  // DATE DISPLAY
  // ============================================================

  formatDate(
    date: string | null | undefined
  ): string {

    if (!date) {

      return '—';

    }


    const parsed =
      new Date(date);


    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {

      return date;

    }


    return new Intl.DateTimeFormat(
      'en-KE',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }
    ).format(parsed);

  }

}
