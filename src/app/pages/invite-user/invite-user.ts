import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { InvitationService } from '../../services/invitations';
import { AuthService } from '../../services/auth';
import { User } from '../../models/user.model';
import { Organization, OrganizationService } from '../../services/organization';

@Component({
  selector: 'app-invite-user',
  imports: [FormsModule],
  templateUrl: './invite-user.html',
  styleUrl: './invite-user.css'
})
export class InviteUser implements OnInit {

  private router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private invitationService = inject(InvitationService);
  private readonly authService = inject(AuthService);
  private readonly organizationService = inject(OrganizationService);
  private directory: Organization[] = [];


  // ============================================================
  // FORM FIELDS
  // ============================================================

  fullName = '';

  email = '';

  phone = '';

  role = '';

  organization =
    this.requestedOrganizationName ??
    this.currentUser?.organizationName ??
    '';


  // ============================================================
  // UI STATE
  // ============================================================

  loading = false;

  errorMessage = '';

  successMessage = '';


  // ============================================================
  // AVAILABLE ROLES
  // ============================================================

  private readonly platformRoles = [
    { value: 'MANUFACTURER_STAFF', label: 'Manufacturer Staff' },
    { value: 'DISTRIBUTOR_STAFF', label: 'Distributor Staff' }
  ];

  get roles(): { value: string; label: string }[] {
    if (this.isPlatformAdmin) {
      if (this.requestedOrganizationType === 'MANUFACTURER') {
        return [this.platformRoles[0]];
      }

      if (this.requestedOrganizationType === 'DISTRIBUTOR') {
        return [this.platformRoles[1]];
      }

      return this.platformRoles;
    }

    const user = this.currentUser;
    const organizationType =
      user?.organizationType?.toUpperCase() ??
      this.roleOrganizationType(user?.role);

    if (
      user?.role === 'MANUFACTURER_ADMIN' ||
      (user?.role === 'ORGANIZATION_ADMIN' &&
        organizationType === 'MANUFACTURER')
    ) {
      return [this.platformRoles[0]];
    }

    if (
      user?.role === 'DISTRIBUTOR_ADMIN' ||
      (user?.role === 'ORGANIZATION_ADMIN' &&
        organizationType === 'DISTRIBUTOR')
    ) {
      return [this.platformRoles[1]];
    }

    return [];
  }

  get isPlatformAdmin(): boolean {
    const user = this.currentUser;

    return user?.role === 'SUPER_ADMIN' ||
      user?.role === 'PLATFORM_ADMIN';
  }

  get organizationDisabled(): boolean {
    return !this.isPlatformAdmin || !!this.requestedOrganizationName;
  }

  private get requestedOrganizationName(): string | null {
    return this.route.snapshot.queryParamMap.get('organizationName');
  }

  private get requestedOrganizationType():
    | 'MANUFACTURER'
    | 'DISTRIBUTOR'
    | null {
    const type =
      this.route.snapshot.queryParamMap.get('organizationType');

    return type === 'MANUFACTURER' || type === 'DISTRIBUTOR'
      ? type
      : null;
  }

  private roleOrganizationType(role?: string): string | undefined {
    if (
      role === 'MANUFACTURER_ADMIN' ||
      role === 'MANUFACTURER_STAFF' ||
      role === 'MANUFACTURER'
    ) {
      return 'MANUFACTURER';
    }

    if (
      role === 'DISTRIBUTOR_ADMIN' ||
      role === 'DISTRIBUTOR_STAFF' ||
      role === 'DISTRIBUTOR'
    ) {
      return 'DISTRIBUTOR';
    }

    return undefined;
  }

  private get currentUser(): User | null {
    return this.authService.getCurrentUser();
  }

  private get requestedOrganizationId(): string | null {
    return this.route.snapshot.queryParamMap.get('organizationId');
  }

  ngOnInit(): void {
    if (!this.isPlatformAdmin) {
      return;
    }

    this.organizationService.getBusinessOrganizations().subscribe({
      next: organizations => {
        this.directory = organizations;
      },
      error: () => {
        this.directory = [];
      }
    });
  }

  private resolveOrganizationId(organizationName: string): string | null {
    if (this.requestedOrganizationId) {
      return this.requestedOrganizationId;
    }

    const wanted = organizationName.trim().toLowerCase();
    const matches = this.directory.filter(
      organization => organization.name.trim().toLowerCase() === wanted
    );

    return matches.length === 1 ? matches[0].id : null;
  }


  // ============================================================
  // SEND INVITATION
  // ============================================================

  inviteUser(): void {

    this.errorMessage = '';
    this.successMessage = '';

    // ----------------------------------------------------------
    // Validate required fields
    // ----------------------------------------------------------

    if (
      !this.fullName.trim() ||
      !this.email.trim() ||
      !this.role
    ) {
      this.errorMessage =
        'Please complete all required fields.';

      return;
    }

    if (!this.roles.some(item => item.value === this.role)) {
      this.errorMessage = 'Select a role available to your account.';
      return;
    }

    const organizationName = this.isPlatformAdmin
      ? this.requestedOrganizationName?.trim() || this.organization.trim()
      : this.currentUser?.organizationName?.trim();

    if (!organizationName) {
      this.errorMessage = this.isPlatformAdmin
        ? 'Please enter an organization name.'
        : 'Your account is not associated with an organization.';
      return;
    }

    const organizationId = this.isPlatformAdmin
      ? this.resolveOrganizationId(organizationName)
      : undefined;

    if (this.isPlatformAdmin && !organizationId) {
      this.errorMessage =
        'Enter the exact name of a manufacturer or distributor organization.';
      return;
    }

    this.organization = organizationName;


    // ----------------------------------------------------------
    // Validate email
    // ----------------------------------------------------------

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(this.email.trim())) {

      this.errorMessage =
        'Please enter a valid email address.';

      return;
    }


    // ----------------------------------------------------------
    // Prepare request
    // ----------------------------------------------------------

    this.loading = true;

    const request = {

      fullName: this.fullName.trim(),

      email: this.email.trim(),

      phoneNumber: this.phone.trim() || undefined,

      role: this.role,

      ...(organizationId ? { organizationId } : {})

    };


    // ----------------------------------------------------------
    // Send request to backend
    // ----------------------------------------------------------

    this.invitationService
      .inviteUser(request)
      .subscribe({

        next: (response) => {

          this.loading = false;

          this.successMessage =
            response.message ||
            `Invitation sent successfully to ${this.email.trim()}.`;

          // Clear form

          this.fullName = '';

          this.email = '';

          this.phone = '';

          this.role = '';

          this.organization = '';

        },

        error: (error) => {

          this.loading = false;

          console.error(
            'Invitation error:',
            error
          );

          if (error?.error?.message) {

            this.errorMessage =
              error.error.message;

          } else if (error?.status === 401) {

            this.errorMessage =
              'Your session has expired. Please log in again.';

          } else if (error?.status === 403) {

            this.errorMessage =
              'You do not have permission to invite users.';

          } else if (error?.status === 400) {

            this.errorMessage =
              'The invitation details are invalid.';

          } else {

            this.errorMessage =
              'Unable to send invitation. Please try again.';

          }

        }

      });

  }


  // ============================================================
  // CANCEL
  // ============================================================

  cancel(): void {

    this.router.navigate(['/users']);

  }

}
