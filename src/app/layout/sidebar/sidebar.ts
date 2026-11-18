
import { Component, EventEmitter, HostListener, inject, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  @Input() sidebarOpen = false;
  @Output() readonly closeSidebar = new EventEmitter<void>();

  private readonly authService = inject(AuthService);

  get canManageUsers(): boolean {
    const user = this.currentUser;

    return !!user && (
      user.role === 'SUPER_ADMIN' ||
      user.role === 'PLATFORM_ADMIN' ||
      user.role === 'ORGANIZATION_ADMIN' ||
      user.role === 'MANUFACTURER_ADMIN' ||
      user.role === 'DISTRIBUTOR_ADMIN'
    );
  }

  get canManageOrganizations(): boolean {
    const user = this.currentUser;

    return user?.role === 'SUPER_ADMIN' ||
      user?.role === 'PLATFORM_ADMIN';
  }

  get canViewManufacturerDashboard(): boolean {
    const user = this.currentUser;

    return !!user && (
      user.role === 'SUPER_ADMIN' ||
      user.role === 'PLATFORM_ADMIN' ||
      user.role === 'MANUFACTURER' ||
      user.role === 'MANUFACTURER_ADMIN' ||
      user.role === 'MANUFACTURER_STAFF' ||
      (
        user.role === 'ORGANIZATION_ADMIN' &&
        user.organizationType?.toUpperCase() === 'MANUFACTURER'
      )
    );
  }

  get canViewDistributorDashboard(): boolean {
    const user = this.currentUser;

    return !!user && (
      user.role === 'SUPER_ADMIN' ||
      user.role === 'PLATFORM_ADMIN' ||
      user.role === 'DISTRIBUTOR' ||
      user.role === 'DISTRIBUTOR_ADMIN' ||
      user.role === 'DISTRIBUTOR_STAFF' ||
      (
        user.role === 'ORGANIZATION_ADMIN' &&
        user.organizationType?.toUpperCase() === 'DISTRIBUTOR'
      )
    );
  }

  private get currentUser(): User | null {
    return this.authService.getCurrentUser();
  }

  logout(): void {
    this.authService.logout();
  }

  @HostListener('click', ['$event'])
  closeAfterNavigation(event: MouseEvent): void {
    const target = event.target;

    if (target instanceof Element && target.closest('a[routerLink]')) {
      this.closeSidebar.emit();
    }
  }

}
