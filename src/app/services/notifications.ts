import { Injectable, inject } from '@angular/core';

import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import {
  BehaviorSubject,
  Observable,
  map,
  tap
} from 'rxjs';

import { AuthService } from './auth';

import {
  Notification,
  NotificationPriority,
  NotificationStatus,
  NotificationType
} from '../models/notification.model';


interface BackendNotificationResponse {

  id: string;

  title: string;

  message: string;

  type: NotificationType;

  priority: NotificationPriority;

  status: NotificationStatus;

  referenceId?: string | null;

  referenceType?: string | null;

  createdAt: string;

  readAt?: string | null;

}


@Injectable({
  providedIn: 'root'
})
export class NotificationsService {

  private http = inject(HttpClient);

  private authService = inject(AuthService);

  private readonly unreadCountSubject =
    new BehaviorSubject<number | null>(null);
  readonly unreadCount$ = this.unreadCountSubject.asObservable();

private readonly apiUrl =
  '/api/notifications';

private readonly accessRequestsApiUrl =
  '/api/admin/access-requests';


  // ============================================================
  // AUTH HEADERS
  // ============================================================

  private getHeaders(): HttpHeaders {

    const token =
      this.authService.getToken();

    return new HttpHeaders({

      Authorization:
        `Bearer ${token}`,

      'Content-Type':
        'application/json'

    });

  }


  // ============================================================
  // GET NOTIFICATIONS
  // ============================================================

  getNotifications(): Observable<Notification[]> {

    return this.http
      .get<BackendNotificationResponse[]>(
        this.apiUrl,
        {
          headers:
            this.getHeaders()
        }
      )
      .pipe(

        map(notifications =>
          notifications.map(
            notification =>
              this.mapNotification(notification)
          )
        )

      );

  }


  // ============================================================
  // GET ONE
  // ============================================================

  getNotification(
    notificationId: string
  ): Observable<Notification> {

    /*
     * The backend currently returns the user's complete
     * notification list rather than a dedicated GET /{id}
     * endpoint.
     *
     * Find the requested notification from that list.
     */

    return this.getNotifications().pipe(

      map(notifications => {

        const notification =
          notifications.find(
            item =>
              item.id === notificationId
          );


        if (!notification) {

          throw new Error(
            'Notification not found'
          );

        }


        return notification;

      })

    );

  }


  // ============================================================
  // UNREAD COUNT
  // ============================================================

  getUnreadCount(): Observable<number> {

    return this.http
      .get<number>(
        `${this.apiUrl}/unread-count`,
        {
          headers:
            this.getHeaders()
        }
      );

  }

  refreshUnreadCount(): Observable<number> {
    return this.getUnreadCount().pipe(
      tap(count => this.unreadCountSubject.next(count))
    );
  }


  // ============================================================
  // MARK AS READ
  // ============================================================

  markAsRead(
    notificationId: string
  ): Observable<void> {

    return this.http.patch<void>(
      `${this.apiUrl}/${notificationId}/read`,
      {},
      {
        headers:
          this.getHeaders()
      }
    ).pipe(
      tap(() => {
        const currentCount = this.unreadCountSubject.value;
        if (currentCount !== null) {
          this.unreadCountSubject.next(Math.max(0, currentCount - 1));
        }
      })
    );

  }


  // ============================================================
  // MARK ALL AS READ
  // ============================================================

  markAllAsRead(): Observable<void> {

    return this.http.patch<void>(
      `${this.apiUrl}/read-all`,
      {},
      {
        headers:
          this.getHeaders()
      }
    ).pipe(
      tap(() => this.unreadCountSubject.next(0))
    );

  }

approveAccessRequest(
  requestId: string
): Observable<any> {
  return this.http.post<any>(
    `${this.accessRequestsApiUrl}/${requestId}/approve`,
    {},
    {
      headers: this.getHeaders()
    }
  );
}

getAccessRequest(
  requestId: string
): Observable<unknown> {
  return this.http.get<unknown>(
    `${this.accessRequestsApiUrl}/${encodeURIComponent(requestId)}`,
    {
      headers: this.getHeaders()
    }
  );
}


rejectAccessRequest(
  requestId: string
): Observable<any> {
  return this.http.post<any>(
    `${this.accessRequestsApiUrl}/${requestId}/reject`,
    {},
    {
      headers: this.getHeaders()
    }
  );
}


resendAccessRequestActivation(
  requestId: string
): Observable<any> {
  return this.http.post<any>(
    `${this.accessRequestsApiUrl}/${requestId}/activation/resend`,
    {},
    {
      headers: this.getHeaders()
    }
  );
}


  // ============================================================
  // MAP BACKEND → FRONTEND
  // ============================================================

  private mapNotification(
    notification: BackendNotificationResponse
  ): Notification {
    const organizationMatch = notification.message.match(
      /\bfor\s+(.+?)\s+\((?:MANUFACTURER|DISTRIBUTOR)\)/i
    );

    return {

      id:
        notification.id,

      title:
        notification.title,

      message:
        notification.message,

      organizationName:
        organizationMatch?.[1]?.trim() || undefined,

      type:
        notification.type,

      priority:
        notification.priority,

      status:
        notification.status,

      referenceId:
        notification.referenceId ?? undefined,

      referenceType:
        notification.referenceType ?? undefined,

      createdAt:
        notification.createdAt,

      readAt:
        notification.readAt ?? null

    };

  }

}
