import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../services/auth';
import { UserRole } from '../../models/user.model';

@Component({
  selector: 'app-signup',
  imports: [FormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  fullName = '';
  email = '';
  phoneNumber = '';
  password = '';
  role: UserRole = 'MANUFACTURER_ADMIN';
  organizationName = '';

  loading = false;
  errorMessage = '';

  readonly registrationRoles: { value: UserRole; label: string }[] = [
    { value: 'MANUFACTURER_ADMIN', label: 'Manufacturer administrator' },
    { value: 'DISTRIBUTOR_ADMIN', label: 'Distributor administrator' },
    { value: 'CUSTOMER', label: 'Customer' }
  ];

  submitRegistration(): void {
    this.errorMessage = '';

    if (
      !this.fullName.trim() ||
      !this.email.trim() ||
      !this.phoneNumber.trim() ||
      !this.organizationName.trim()
    ) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    if (
      this.password.length < 8 ||
      this.password.length > 72 ||
      !/[A-Z]/.test(this.password) ||
      !/[a-z]/.test(this.password) ||
      !/\d/.test(this.password)
    ) {
      this.errorMessage =
        'Password must be 8–72 characters and include an uppercase letter, a lowercase letter, and a digit.';
      return;
    }

    this.loading = true;

    this.authService.register(
      this.fullName,
      this.email,
      this.phoneNumber,
      this.password,
      this.role,
      this.organizationName
    ).subscribe({
      next: () => {
        this.loading = false;
        sessionStorage.setItem(
          'verification_identifier',
          this.email.trim()
        );
        this.router.navigateByUrl('/verification');
      },
      error: (error: unknown) => {
        this.loading = false;

        if (error instanceof HttpErrorResponse) {
          const responseBody =
            typeof error.error === 'object' && error.error !== null
              ? error.error as { message?: string }
              : null;
          this.errorMessage =
            responseBody?.message ||
            (error.status === 0
              ? 'Could not reach the registration server. Check your connection and try again.'
              : 'Unable to create your account. Please review your details and try again.');
          return;
        }

        this.errorMessage = 'Unable to create your account. Please try again.';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
