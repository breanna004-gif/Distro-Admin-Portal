import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { User, UserRole } from '../models/user.model';

interface BackendUserResponse {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  status?: string;
  organizationId?: string;
  organizationName?: string;
  organizationType?: string;
  phoneVerified: boolean;
  emailVerified?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn?: number;
  expiresInSeconds?: number;
  homePath?: string | null;
  redirectPath?: string | null;
  user: BackendUserResponse;
}

export interface RegisterResponse {
  userId?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

private readonly apiUrl = '/api/auth';

private readonly userApiUrl = '/api/users';

  private readonly tokenKey =
    'admin_access_token';

  private readonly refreshTokenKey =
    'admin_refresh_token';

  private readonly userKey =
    'admin_user';


  constructor(
    private http: HttpClient,
    private router: Router
  ) {}


  // ============================================================
  // LOGIN
  // ============================================================

  login(
    identifier: string,
    password: string
  ): Observable<AuthResponse> {

    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      {
        identifier: identifier.trim(),
        password
      }
    ).pipe(
      tap(response => {
        this.storeAuthResponse(response);
      })
    );
  }


  // ============================================================
  // REGISTER
  // ============================================================

  register(
    fullName: string,
    email: string,
    phoneNumber: string,
    password: string,
    role: UserRole,
    organizationName: string
  ): Observable<RegisterResponse> {

    return this.http.post<RegisterResponse>(
      `${this.apiUrl}/register`,
      {
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
        role,
        organizationName: organizationName.trim()
      }
    );
  }


  // ============================================================
  // VERIFY ACCOUNT
  // ============================================================

  verifyAccount(
    identifier: string,
    otp: string
  ): Observable<AuthResponse> {

    return this.http.post<AuthResponse>(
      `${this.apiUrl}/verify-account`,
      {
        identifier: identifier.trim(),
        otp: otp.trim()
      }
    ).pipe(
      tap(response => {
        this.storeAuthResponse(response);
      })
    );
  }


  // ============================================================
  // RESEND VERIFICATION
  // ============================================================

  resendVerification(
    identifier: string
  ): Observable<{ message: string }> {

    return this.http.post<{ message: string }>(
      `${this.apiUrl}/resend-verification`,
      {
        identifier: identifier.trim()
      }
    );
  }


  // ============================================================
  // GET CURRENT PROFILE
  // ============================================================

  getProfile(): Observable<BackendUserResponse> {

    return this.http.get<BackendUserResponse>(
      `${this.userApiUrl}/me`
    );
  }


  // ============================================================
  // REFRESH TOKEN
  // ============================================================

  refresh(
    refreshToken: string
  ): Observable<AuthResponse> {

    return this.http.post<AuthResponse>(
      `${this.apiUrl}/refresh`,
      {
        refreshToken
      }
    ).pipe(
      tap(response => {
        this.storeAuthResponse(response);
      })
    );
  }


  // ============================================================
  // LOGOUT
  // ============================================================

  logout(): void {

    const refreshToken =
      localStorage.getItem(this.refreshTokenKey);

    if (refreshToken) {

      this.http.post(
        `${this.apiUrl}/logout`,
        {
          refreshToken
        }
      ).subscribe({
        error: () => {
          // Ignore logout API errors.
        }
      });
    }

    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);

    this.router.navigate(['/login']);
  }


  // ============================================================
  // AUTHENTICATION
  // ============================================================

  isAuthenticated(): boolean {

    return !!localStorage.getItem(
      this.tokenKey
    );
  }


  // ============================================================
  // CURRENT USER
  // ============================================================

  getCurrentUser(): User | null {

    const storedUser =
      localStorage.getItem(this.userKey);

    if (!storedUser) {
      return null;
    }

    try {

      return JSON.parse(storedUser) as User;

    } catch {

      localStorage.removeItem(this.userKey);

      return null;
    }
  }


  // ============================================================
  // TOKEN
  // ============================================================

  getToken(): string | null {

    return localStorage.getItem(
      this.tokenKey
    );
  }


  getRefreshToken(): string | null {

    return localStorage.getItem(
      this.refreshTokenKey
    );
  }


  // ============================================================
  // ROLE
  // ============================================================

  getUserRole(): UserRole | null {

    const user =
      this.getCurrentUser();

    return user?.role ?? null;
  }


  hasRole(
    role: UserRole
  ): boolean {

    const user =
      this.getCurrentUser();

    return user?.role === role;
  }


  hasAnyRole(
    roles: UserRole[]
  ): boolean {

    const user =
      this.getCurrentUser();

    if (!user) {
      return false;
    }

    return roles.includes(user.role);
  }


  // ============================================================
  // PLATFORM ADMIN
  // ============================================================

  isPlatformAdmin(): boolean {

    return this.hasAnyRole([
      'SUPER_ADMIN',
      'PLATFORM_ADMIN'
    ]);
  }


  // ============================================================
  // ORGANIZATION ADMIN
  // ============================================================

  isOrganizationAdmin(): boolean {

    const role =
      this.getUserRole();

    return (
      role === 'ORGANIZATION_ADMIN' ||
      role === 'MANUFACTURER_ADMIN' ||
      role === 'DISTRIBUTOR_ADMIN'
    );
  }


  // ============================================================
  // MANUFACTURER
  // ============================================================

  isManufacturer(): boolean {

    const role =
      this.getUserRole();

    return (
      role === 'MANUFACTURER' ||
      role === 'MANUFACTURER_ADMIN' ||
      role === 'MANUFACTURER_STAFF'
    );
  }


  // ============================================================
  // DISTRIBUTOR
  // ============================================================

  isDistributor(): boolean {

    const role =
      this.getUserRole();

    return (
      role === 'DISTRIBUTOR' ||
      role === 'DISTRIBUTOR_ADMIN' ||
      role === 'DISTRIBUTOR_STAFF'
    );
  }


  // ============================================================
  // ORGANIZATION ID
  // ============================================================

  getOrganizationId(): string | null {

    const user =
      this.getCurrentUser();

    return user?.organizationId ?? null;
  }


  // ============================================================
  // STORE AUTH RESPONSE
  // ============================================================

  private storeAuthResponse(
    response: AuthResponse
  ): void {

    localStorage.setItem(
      this.tokenKey,
      response.accessToken
    );

    localStorage.setItem(
      this.refreshTokenKey,
      response.refreshToken
    );

    const user: User = {

      id: response.user.id,

      name: response.user.fullName,

      email: response.user.email,

      phone: response.user.phoneNumber,

      role: response.user.role,

      organizationId:
        response.user.organizationId,

      organizationName:
        response.user.organizationName,

      organizationType:
        response.user.organizationType,

      phoneVerified:
        response.user.phoneVerified,

      emailVerified:
        response.user.emailVerified,

      status:
        this.normalizeStatus(
          response.user.status
        )
    };

    localStorage.setItem(
      this.userKey,
      JSON.stringify(user)
    );
  }


  // ============================================================
  // NORMALIZE STATUS
  // ============================================================

  private normalizeStatus(
    status?: string
  ): User['status'] {

    switch (status) {

      case 'ACTIVE':
        return 'ACTIVE';

      case 'INACTIVE':
        return 'INACTIVE';

      case 'SUSPENDED':
        return 'SUSPENDED';

      case 'DEACTIVATED':
        return 'DEACTIVATED';

      case 'PENDING':
        return 'PENDING';

      default:
        return 'ACTIVE';
    }
  }
}
