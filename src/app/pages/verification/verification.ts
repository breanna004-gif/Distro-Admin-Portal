import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-verification',
  imports: [FormsModule],
  templateUrl: './verification.html',
  styleUrl: './verification.css'
})
export class Verification {

  private authService = inject(AuthService);
  private router = inject(Router);

  identifier = '';
  otp = '';

  loading = false;
  resending = false;

  errorMessage = '';
  successMessage = '';

  constructor() {
    const savedIdentifier =
      sessionStorage.getItem('verification_identifier');

    if (savedIdentifier) {
      this.identifier = savedIdentifier;
    }
  }

  verify(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.identifier.trim()) {
      this.errorMessage =
        'Please enter your email address or phone number.';
      return;
    }

    if (!this.otp.trim()) {
      this.errorMessage =
        'Please enter the verification code.';
      return;
    }

    if (!/^\d{6}$/.test(this.otp.trim())) {
      this.errorMessage =
        'The verification code must contain 6 digits.';
      return;
    }

    this.loading = true;

    this.authService
      .verifyAccount(
        this.identifier,
        this.otp
      )
      .subscribe({
        next: response => {

          this.loading = false;

          this.successMessage =
            'Account verified successfully.';

          sessionStorage.removeItem(
            'verification_identifier'
          );

          setTimeout(() => {

            this.router.navigateByUrl(
              response.homePath || response.redirectPath || '/dashboard'
            );

          }, 500);
        },

        error: error => {

          this.loading = false;

          console.error(
            'Verification failed:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'The verification code is invalid or has expired.';
        }
      });
  }

  resendCode(): void {

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.identifier.trim()) {
      this.errorMessage =
        'Please enter your email address or phone number first.';
      return;
    }

    this.resending = true;

    this.authService
      .resendVerification(this.identifier)
      .subscribe({

        next: response => {

          this.resending = false;

          this.successMessage =
            response?.message ||
            'A new verification code has been sent.';
        },

        error: error => {

          this.resending = false;

          console.error(
            'Resend verification failed:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'Unable to resend the verification code.';
        }
      });
  }

  backToLogin(): void {
    this.router.navigate(['/login']);
  }
}
