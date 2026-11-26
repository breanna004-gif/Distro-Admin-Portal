import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import {
  OrganizationService,
  Organization,
  CreateOrganizationRequest
} from '../../services/organization';
import {
  AccessRequestService,
  CreateAccessRequest
} from '../../services/access-request';
import { NotificationsService } from '../../services/notifications';
import { InvitationService } from '../../services/invitations';

@Component({
  selector: 'app-create-organization',
  imports: [FormsModule],
  templateUrl: './create-organization.html',
  styleUrl: './create-organization.css'
})
export class CreateOrganization {

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private organizationService = inject(OrganizationService);
  private accessRequestService = inject(AccessRequestService);
  private notificationsService = inject(NotificationsService);
  private invitationService = inject(InvitationService);

  name = '';

  type: 'MANUFACTURER' | 'DISTRIBUTOR' = 'MANUFACTURER';

  contactName = '';

  email = '';

  phone = '';

  location = '';

  loading = false;

  requestLoading = false;

  invitationLoading = false;

  errorMessage = '';

  successMessage = '';

  requestErrorMessage = '';

  invitationErrorMessage = '';

  accessRequestSubmitted = false;

  invitationSent = false;

  createdOrganization: Organization | null = null;

  ngOnInit(): void {
    this.type =
      this.route.snapshot.queryParamMap.get('type') === 'DISTRIBUTOR'
        ? 'DISTRIBUTOR'
        : 'MANUFACTURER';
  }

  createOrganization(): void {

    this.errorMessage = '';
    this.successMessage = '';
    this.requestErrorMessage = '';
    this.invitationErrorMessage = '';
    this.accessRequestSubmitted = false;
    this.invitationSent = false;
    this.createdOrganization = null;

    if (!this.name.trim()) {

      this.errorMessage =
        'Please enter an organization name.';

      return;
    }

    if (!this.contactName.trim() || !this.email.trim() || !this.phone.trim()) {
      this.errorMessage = 'Enter the primary contact name, email, and phone number to request admin access.';
      return;
    }

    if (!this.type) {

      this.errorMessage =
        'Please select an organization type.';

      return;
    }

    this.loading = true;

    const request: Omit<CreateOrganizationRequest, 'type'> = {
      name: this.name.trim(),
      contactName: this.contactName.trim() || undefined,
      email: this.email.trim() || undefined,
      phone: this.phone.trim() || undefined,
      location: this.location.trim() || undefined
    };

    const createRequest = this.type === 'MANUFACTURER'
      ? this.organizationService.createManufacturer(request)
      : this.organizationService.createDistributor(request);

    createRequest
      .subscribe({

        next: (organization: Organization) => {

          this.loading = false;
          this.createdOrganization = {
            ...organization,
            name: organization.name || request.name
          };
          this.successMessage =
            `${this.organizationTypeLabel} "${this.createdOrganization.name}" created. Submitting the admin access request...`;
          this.submitAccessRequest();

        },

        error: (error: any) => {

          this.loading = false;

          console.error(
            'Failed to create organization:',
            error
          );

          if (error?.status === 401) {

            this.errorMessage =
              'Your session has expired. Please log in again.';

          } else if (error?.status === 403) {

            this.errorMessage =
              'You do not have permission to create organizations.';

          } else if (error?.status === 400) {

            this.errorMessage =
              error?.error?.message ||
              'The organization details are invalid.';

          } else {

            this.errorMessage =
              'Unable to create organization. Please try again.';

          }

        }

      });

  }

  retryAccessRequest(): void {
    if (
      !this.createdOrganization ||
      this.accessRequestSubmitted ||
      this.requestLoading
    ) {
      return;
    }

    this.submitAccessRequest();
  }

  retryInvitation(): void {
    if (
      !this.createdOrganization ||
      !this.accessRequestSubmitted ||
      this.invitationSent ||
      this.invitationLoading
    ) {
      return;
    }

    this.sendAdminInvitation();
  }

  private submitAccessRequest(): void {
    const organization = this.createdOrganization;
    if (!organization) {
      return;
    }

    this.requestLoading = true;
    this.requestErrorMessage = '';
    this.successMessage =
      'Submitting the admin access request...';

    const request: CreateAccessRequest = {
      fullName: this.contactName.trim(),
      email: this.email.trim(),
      phoneNumber: this.phone.trim(),
      organizationName: organization.name,
      organizationType: this.type,
      requestedRole: this.type === 'MANUFACTURER'
        ? 'MANUFACTURER_ADMIN'
        : 'DISTRIBUTOR_ADMIN'
    };

    this.accessRequestService.submitRequest(request).subscribe({
      next: response => {
        this.requestLoading = false;
        this.accessRequestSubmitted = true;
        this.successMessage = response.message ||
          `Admin access request submitted for ${this.email.trim()}. An invitation email will be sent next.`;
        this.notificationsService.refreshUnreadCount().subscribe({
          error: error => {
            console.error('Failed to refresh notification count:', error);
          }
        });
        this.sendAdminInvitation();
      },
      error: error => {
        console.error('Failed to submit organization admin access request:', error);
        this.requestLoading = false;
        this.successMessage =
          `${this.organizationTypeLabel} "${organization.name}" was created, but the access request could not be submitted. The invitation email was not sent.`;
        this.requestErrorMessage =
          error?.error?.message ||
          'Unable to submit the admin access request. Please try again.';
      }
    });
  }

  private sendAdminInvitation(): void {
    const organization = this.createdOrganization;
    if (
      !organization ||
      !this.accessRequestSubmitted ||
      this.invitationSent
    ) {
      return;
    }

    this.invitationLoading = true;
    this.invitationErrorMessage = '';
    this.successMessage =
      `Sending an admin invitation to ${this.email.trim()}...`;

    this.invitationService.inviteUser({
      fullName: this.contactName.trim(),
      email: this.email.trim(),
      phoneNumber: this.phone.trim(),
      role: this.type === 'MANUFACTURER'
        ? 'MANUFACTURER_ADMIN'
        : 'DISTRIBUTOR_ADMIN',
      organizationId: organization.id
    }).subscribe({
      next: response => {
        this.invitationLoading = false;
        this.invitationSent = true;
        this.successMessage = response.message ||
          `Invitation sent to ${this.email.trim()}. The admin access request is pending your approval.`;
      },
      error: error => {
        console.error('Failed to send organization admin invitation:', error);
        this.invitationLoading = false;
        this.successMessage =
          `The admin access request is pending, but the invitation email could not be sent.`;
        this.invitationErrorMessage =
          error?.error?.message ||
          'Unable to send the admin invitation. Please try again.';
      }
    });
  }

  get organizationTypeLabel(): string {
    return this.type === 'MANUFACTURER' ? 'Manufacturer' : 'Distributor';
  }

  cancel(): void {

    void this.router.navigate([
      this.type === 'MANUFACTURER' ? '/manufacturers' : '/distributors'
    ]);

  }

}
