import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InviteUserRequest {
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  organizationName?: string;
}

export interface InviteUserResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class InvitationService {

  private http = inject(HttpClient);

  private readonly apiUrl =
    '/api/users';

  inviteUser(
    request: InviteUserRequest
  ): Observable<InviteUserResponse> {

    const token =
      localStorage.getItem('admin_access_token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post<InviteUserResponse>(
      `${this.apiUrl}/invite`,
      request,
      { headers }
    );
  }
}
