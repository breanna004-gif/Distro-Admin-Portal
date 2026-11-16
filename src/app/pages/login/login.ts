
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  email = '';
  password = '';

  errorMessage = '';
  showVerificationLink = false;
  isLoading = false;

  login(): void {
    this.errorMessage = '';
    this.showVerificationLink = false;

    if (!this.email.trim() || !this.password) {
      this.errorMessage =
        'Please enter your email or phone number and password.';
      return;
    }

    this.isLoading = true;

    this.authService.login(
      this.email.trim(),
      this.password
    ).subscribe({
      next: response => {
        this.isLoading = false;

        const redirectPath =
          response.homePath ||
          response.redirectPath ||
          '/dashboard';

        void this.router.navigateByUrl(redirectPath);
      },

      error: (error: unknown) => {
        this.isLoading = false;

        if (!(error instanceof HttpErrorResponse)) {
          this.errorMessage =
            'Unable to connect to the server. Please try again.';
          return;
        }

        const responseBody =
          typeof error.error === 'object' && error.error !== null
            ? error.error as {
                code?: string;
                errorCode?: string;
                message?: string;
              }
            : null;

        const errorCode =
          responseBody?.code ?? responseBody?.errorCode;

        if (errorCode === 'ACCOUNT_NOT_VERIFIED') {
          sessionStorage.setItem(
            'verification_identifier',
            this.email.trim()
          );

          this.errorMessage =
            responseBody?.message ||
            'Your account is not verified. Use the link below to enter your verification code.';

          this.showVerificationLink = true;
          return;
        }

        if (
          errorCode === 'INVALID_CREDENTIALS' ||
          error.status === 401
        ) {
          this.errorMessage =
            responseBody?.message ||
            'Invalid email/phone number or password.';
          return;
        }

        if (error.status === 0) {
          this.errorMessage =
            'Could not reach the authentication server. Check your connection and try again.';
          return;
        }

        if (error.status === 403) {
          this.errorMessage =
            responseBody?.message ||
            'Your account does not have access to this portal.';
          return;
        }

        this.errorMessage =
          responseBody?.message ||
          'Unable to sign in. Please try again.';
      }
    });
  }
}
