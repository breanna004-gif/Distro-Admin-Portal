
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

interface PlatformSettings {
  id?: number;
  platformName: string;
  currency: string;
  timezone: string;
  lowStockThreshold: number;
  emailNotifications: boolean;
  systemNotifications: boolean;
  updatedAt?: string;
}

@Component({
  selector: 'app-settings',
  imports: [FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/settings';

  private readonly defaults: PlatformSettings = {
    platformName: 'SupplyChain',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    lowStockThreshold: 10,
    emailNotifications: true,
    systemNotifications: true
  };

  private originalSettings: PlatformSettings = { ...this.defaults };

  platformName = this.defaults.platformName;
  currency = this.defaults.currency;
  timezone = this.defaults.timezone;
  lowStockThreshold = this.defaults.lowStockThreshold;
  emailNotifications = this.defaults.emailNotifications;
  systemNotifications = this.defaults.systemNotifications;

  isLoading = false;
  isSaving = false;
  hasLoadedSettings = false;

  ngOnInit(): void {
    this.loadSettings();
  }

  private loadSettings(): void {
    this.isLoading = true;

    this.http.get<PlatformSettings>(this.apiUrl).subscribe({
      next: (settings) => {
        this.applySettings(settings);
        this.originalSettings = { ...settings };
        this.hasLoadedSettings = true;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        console.error('Failed to load platform settings:', error);
        alert(this.getErrorMessage(error, 'Could not load settings.'));
      }
    });
  }

  private applySettings(settings: PlatformSettings): void {
    this.platformName = settings.platformName;
    this.currency = settings.currency;
    this.timezone = settings.timezone;
    this.lowStockThreshold = settings.lowStockThreshold;
    this.emailNotifications = settings.emailNotifications;
    this.systemNotifications = settings.systemNotifications;
  }

  saveSettings(): void {
    if (this.isSaving || this.isLoading) {
      return;
    }

    if (!this.platformName.trim()) {
      alert('Platform name is required.');
      return;
    }

    if (this.platformName.trim().length > 100) {
      alert('Platform name cannot exceed 100 characters.');
      return;
    }

    if (
      !Number.isInteger(Number(this.lowStockThreshold)) ||
      Number(this.lowStockThreshold) < 0
    ) {
      alert('Low-stock threshold must be a whole number of zero or greater.');
      return;
    }

    if (!['KES', 'USD', 'EUR', 'GBP'].includes(this.currency)) {
      alert('Please select a supported currency.');
      return;
    }

    const payload: PlatformSettings = {
      platformName: this.platformName.trim(),
      currency: this.currency,
      timezone: this.timezone,
      lowStockThreshold: Number(this.lowStockThreshold),
      emailNotifications: this.emailNotifications,
      systemNotifications: this.systemNotifications
    };

    this.isSaving = true;

    this.http.put<PlatformSettings>(this.apiUrl, payload).subscribe({
      next: (savedSettings) => {
        this.applySettings(savedSettings);
        this.originalSettings = { ...savedSettings };
        this.hasLoadedSettings = true;
        this.isSaving = false;
        alert('Settings saved successfully.');
      },
      error: (error: HttpErrorResponse) => {
        this.isSaving = false;
        console.error('Failed to save platform settings:', error);
        alert(this.getErrorMessage(error, 'Could not save settings.'));
      }
    });
  }

  resetSettings(): void {
    if (this.isSaving || this.isLoading) {
      return;
    }

    if (!this.hasLoadedSettings) {
      alert('Settings have not loaded from the server yet. Please reload the page and try again.');
      return;
    }

    this.applySettings(this.originalSettings);
  }

  private getErrorMessage(
    error: HttpErrorResponse,
    fallback: string
  ): string {
    const message = error.error?.message || error.error?.error;

    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    if (error.status === 401 || error.status === 403) {
      return 'You are not authorized to manage platform settings. Please check your account permissions.';
    }

    if (error.status === 0) {
      return 'Cannot reach the backend. Check that the Spring Boot server is running.';
    }

    if (error.status === 404) {
      return 'The settings endpoint or settings record could not be found.';
    }

    return fallback;
  }
}
