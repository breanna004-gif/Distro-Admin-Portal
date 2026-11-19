
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Driver,
  DriverStatus,
  DriverOnboardingStatus
} from '../../models/driver.model';
import { DriverManagementService } from '../../services/driver-management.service';

@Component({
  selector: 'app-drivers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './drivers.html',
  styleUrl: './drivers.css'
})
export class Drivers {
  private readonly driverService = inject(DriverManagementService);

  drivers: Driver[] = [];
  searchTerm = '';

  showRegistrationForm = false;
  selectedDriver: Driver | null = null;
  loadingDriverDetails = false;
  driverDetailsError = '';
  onboardingResult: Driver | null = null;

  errorMessage = '';
  successMessage = '';

  form = this.emptyForm();

  constructor() {
    this.refreshDrivers();
  }

  private emptyForm() {
    return {
      fullName: '',
      email: '',
      phone: '',
      licenceNumber: '',
      licenceExpiry: '',
      nationalId: '',
      notes: ''
    };
  }

  refreshDrivers(): void {
    this.driverService.getDrivers().subscribe({
      next: drivers => {
        this.drivers = drivers;
      },
      error: () => {
        this.errorMessage = 'Unable to load drivers. Please try again.';
      }
    });
  }

  get filteredDrivers(): Driver[] {
    const query = this.searchTerm.trim().toLowerCase();

    return this.drivers.filter(driver => {
      const matchesSearch =
        !query ||
        driver.fullName.toLowerCase().includes(query) ||
        driver.email.toLowerCase().includes(query) ||
        driver.phone.toLowerCase().includes(query) ||
        driver.id.toLowerCase().includes(query) ||
        driver.licenceNumber.toLowerCase().includes(query);

      return matchesSearch;
    });
  }

  get totalDrivers(): number {
    return this.drivers.length;
  }

  get pendingDrivers(): number {
    return this.drivers.filter(driver => driver.status === 'PENDING').length;
  }

  get approvedDrivers(): number {
    return this.drivers.filter(driver => driver.status === 'APPROVED').length;
  }

  get suspendedDrivers(): number {
    return this.drivers.filter(driver => driver.status === 'SUSPENDED').length;
  }

  openRegistration(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.selectedDriver = null;
    this.onboardingResult = null;
    this.form = this.emptyForm();
    this.showRegistrationForm = true;
  }

  closeRegistration(): void {
    this.showRegistrationForm = false;
    this.errorMessage = '';
  }

  registerDriver(): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.driverService.registerDriver({
        fullName: this.form.fullName.trim(),
        email: this.form.email.trim(),
        phone: this.form.phone.trim(),
        licenseNumber: this.form.licenceNumber.trim(),
        licenseExpiryDate: this.form.licenceExpiry,
        nationalId: this.form.nationalId.trim(),
        notes: this.form.notes.trim()
      })
      .subscribe({
        next: createdDriver => {
          this.refreshDrivers();
          this.showRegistrationForm = false;
          this.form = this.emptyForm();
          this.onboardingResult = createdDriver;
          this.successMessage = 'Driver registered successfully.';
        },
        error: error => {
          this.errorMessage = this.getApiErrorMessage(
            error,
            'Unable to register this driver.'
          );
        }
      });
  }

  closeOnboardingResult(): void {
    this.onboardingResult = null;
  }

  resendInvitation(driver: Driver): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.driverService.resendInvitation(driver.id).subscribe({
      next: updated => {
        this.refreshDrivers();
        this.selectedDriver = this.selectedDriver?.id === updated.id
          ? updated
          : this.selectedDriver;
        this.onboardingResult = updated;
        this.successMessage = 'Invitation resent successfully.';
      },
      error: error => {
        this.errorMessage = this.getApiErrorMessage(
          error,
          'Unable to resend this driver invitation.'
        );
      }
    });
  }

  resendLoginEmail(driver: Driver): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.driverService.sendLoginEmail(driver.id).subscribe({
      next: updated => {
        this.refreshDrivers();
        this.selectedDriver = this.selectedDriver?.id === updated.id
          ? updated
          : this.selectedDriver;
        this.successMessage = `A new temporary password was sent to ${driver.email}. Approval was not repeated.`;
        this.errorMessage = '';
      },
      error: error => {
        this.errorMessage = this.getApiErrorMessage(
          error,
          'Unable to send the driver sign-in email.'
        );
      }
    });
  }

  viewDriver(driver: Driver): void {
    this.selectedDriver = driver;
    this.loadingDriverDetails = true;
    this.driverDetailsError = '';
    this.showRegistrationForm = false;
    this.onboardingResult = null;
    this.errorMessage = '';
    this.successMessage = '';

    this.driverService.getDriverById(driver.id).subscribe({
      next: details => {
        if (this.selectedDriver?.id === driver.id) {
          this.selectedDriver = details;
          this.loadingDriverDetails = false;
        }
      },
      error: error => {
        console.error(`Failed to load driver ${driver.id}:`, error);
        if (this.selectedDriver?.id === driver.id) {
          this.driverDetailsError = this.getApiErrorMessage(
            error,
            'Unable to load complete driver details. Showing available directory information.'
          );
          this.loadingDriverDetails = false;
        }
      }
    });
  }

  closeDriverDetails(): void {
    this.selectedDriver = null;
    this.loadingDriverDetails = false;
    this.driverDetailsError = '';
  }

  approveDriver(driver: Driver): void {
    this.updateDriverStatus(driver, 'APPROVED');
  }

  reviewProfileChange(driver: Driver, decision: 'APPROVED' | 'REJECTED'): void {
    this.driverService.reviewProfileChange(driver.id, decision).subscribe({
      next: updated => {
        this.refreshDrivers();
        this.selectedDriver = this.selectedDriver?.id === updated.id
          ? updated
          : this.selectedDriver;
        this.successMessage = decision === 'APPROVED'
          ? `${driver.fullName}'s profile change was approved.`
          : `${driver.fullName}'s profile change was rejected.`;
        this.errorMessage = '';
      },
      error: error => {
        this.errorMessage = this.getApiErrorMessage(
          error,
          'Unable to review this profile change.'
        );
      }
    });
  }

  rejectDriver(driver: Driver): void {
    this.updateDriverStatus(driver, 'REJECTED');
  }

  suspendDriver(driver: Driver): void {
    this.updateDriverStatus(driver, 'SUSPENDED');
  }

  reactivateDriver(driver: Driver): void {
    this.driverService.updateAccountStatus(driver.id, 'ACTIVE').subscribe({
      next: updated => {
        this.refreshDrivers();
        this.selectedDriver = this.selectedDriver?.id === updated.id
          ? updated
          : this.selectedDriver;
        this.successMessage = `${driver.fullName} has been reactivated.`;
        this.errorMessage = '';
      },
      error: error => {
        this.errorMessage = this.getApiErrorMessage(
          error,
          'Unable to update this driver.'
        );
      }
    });
  }

  private updateDriverStatus(driver: Driver, status: DriverStatus): void {
    this.driverService.updateDriverStatus(driver.id, status).subscribe({
      next: updated => {
        this.refreshDrivers();
        this.selectedDriver = this.selectedDriver?.id === updated.id
          ? updated
          : this.selectedDriver;
        const action = status === 'APPROVED' && driver.status !== 'PENDING'
          ? 'reactivated'
          : status.toLowerCase();
        this.successMessage = status === 'APPROVED' && driver.status === 'PENDING'
          ? `${driver.fullName} has been approved. A temporary password was sent to their email.`
          : `${driver.fullName} has been ${action}.`;
        this.errorMessage = '';
      },
      error: error => {
        this.errorMessage = this.getApiErrorMessage(
          error,
          'Unable to update this driver.'
        );
      }
    });
  }

  private getApiErrorMessage(error: unknown, fallback: string): string {
    if (
      error instanceof HttpErrorResponse &&
      typeof error.error?.message === 'string'
    ) {
      return error.error.message;
    }

    return fallback;
  }

  statusLabel(status: DriverStatus): string {
    const labels: Record<DriverStatus, string> = {
      PENDING: 'Pending review',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      SUSPENDED: 'Suspended',
      INACTIVE: 'Inactive'
    };

    return labels[status];
  }

  onboardingStatusLabel(status: DriverOnboardingStatus): string {
    const labels: Record<DriverOnboardingStatus, string> = {
      INVITATION_PENDING: 'Invitation pending',
      INVITED: 'Invitation sent',
      PASSWORD_CHANGE_REQUIRED: 'Password change required',
      ACTIVATED: 'Account activated',
      EXPIRED: 'Invitation expired',
      REVOKED: 'Invitation revoked'
    };

    return labels[status];
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  trackByDriverId(_index: number, driver: Driver): string {
    return driver.id;
  }
}
