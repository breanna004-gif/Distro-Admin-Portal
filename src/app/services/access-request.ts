import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateAccessRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  organizationName: string;
  organizationType: 'MANUFACTURER' | 'DISTRIBUTOR';
  requestedRole: 'MANUFACTURER_ADMIN' | 'DISTRIBUTOR_ADMIN';
}

export interface AccessRequestResponse {
  id?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  organizationName?: string;
  organizationType?: string;
  requestedRole?: string;
  status?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccessRequestService {

  private http = inject(HttpClient);

  private readonly apiUrl =
    '/api/access-requests';

  submitRequest(
    request: CreateAccessRequest
  ): Observable<AccessRequestResponse> {

    return this.http.post<AccessRequestResponse>(
      this.apiUrl,
      request
    );
  }
}
