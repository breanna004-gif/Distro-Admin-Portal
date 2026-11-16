import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import {
  User,
  UserRole,
  UserStatus
} from '../models/user.model';

interface BackendUserResponse {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  role: UserRole;
  status?: UserStatus;
  organizationId?: string | null;
  organizationName?: string | null;
  organizationType?: string | null;
  invitationStatus?: string | null;
  otpDeliveryStatus?: string | null;
  activationLinkDeliveryStatus?: string | null;
  invitationSentAt?: string | null;
  phoneVerified: boolean;
}

interface BackendUsersPageResponse {
  content: BackendUserResponse[];
  totalElements?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private http = inject(HttpClient);

  private readonly apiUrl = '/api/admin/users';

  private mapUser(user: BackendUserResponse): User {
    return {
      id: user.id,
      name: user.fullName,
      email: user.email,
      phone: user.phoneNumber ?? '',
      role: user.role,
      status: user.status ?? 'PENDING',
      organizationId: user.organizationId ?? undefined,
      organizationName: user.organizationName ?? undefined,
      organizationType: user.organizationType ?? undefined,
      invitationStatus: user.invitationStatus ?? undefined,
      otpDeliveryStatus: user.otpDeliveryStatus ?? undefined,
      activationLinkDeliveryStatus:
        user.activationLinkDeliveryStatus ?? undefined,
      invitationSentAt: user.invitationSentAt ?? undefined,
      phoneVerified: user.phoneVerified
    };
  }

  getUsers(
    page: number = 0,
    size: number = 20,
    search: string = ''
  ): Observable<User[]> {
    return this.http
      .get<BackendUserResponse[] | BackendUsersPageResponse>(this.apiUrl)
      .pipe(
        map(response => {
          const users = Array.isArray(response)
            ? response
            : response.content;

          return users.map(user => this.mapUser(user));
        })
      );
  }

  getUserCount(): Observable<number> {
    return this.http
      .get<BackendUserResponse[] | BackendUsersPageResponse>(this.apiUrl)
      .pipe(
        map(response =>
          Array.isArray(response)
            ? response.length
            : response.totalElements ?? response.content.length
        )
      );
  }

  getUsersForOrganization(
    organizationId: string,
    organizationName: string
  ): Observable<User[]> {
    const normalizedName = organizationName.trim().toLowerCase();
    const params = new HttpParams().set('organizationId', organizationId);

    return this.http
      .get<BackendUserResponse[] | BackendUsersPageResponse>(
        this.apiUrl,
        { params }
      )
      .pipe(
        map(response => {
          const users = Array.isArray(response)
            ? response
            : response.content;

          return users
            .map(user => this.mapUser(user))
            .filter(user =>
              user.organizationId
                ? user.organizationId === organizationId
                : user.organizationName?.trim().toLowerCase() === normalizedName
            );
        })
      );
  }

  getUser(userId: string): Observable<User> {
    return this.http
      .get<BackendUserResponse>(`${this.apiUrl}/${userId}`)
      .pipe(map(user => this.mapUser(user)));
  }

 deleteUser(userId: string): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/${userId}`);
}

  updateUserStatus(
    userId: string,
    status: UserStatus
  ): Observable<User> {
    return this.http
      .patch<BackendUserResponse>(
        `${this.apiUrl}/${userId}/status`,
        { status }
      )
      .pipe(map(user => this.mapUser(user)));
  }

  activateUser(userId: string): Observable<User> {
    return this.updateUserStatus(userId, 'ACTIVE');
  }

  deactivateUser(userId: string): Observable<User> {
    return this.updateUserStatus(userId, 'DEACTIVATED');
  }

  suspendUser(userId: string): Observable<User> {
    return this.updateUserStatus(userId, 'SUSPENDED');
  }
}
