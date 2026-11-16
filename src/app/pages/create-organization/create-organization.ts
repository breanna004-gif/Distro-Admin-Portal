import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  OrganizationService,
  Organization,
  CreateOrganizationRequest
} from '../../services/organization';

@Component({
  selector: 'app-create-organization',
  imports: [FormsModule],
  templateUrl: './create-organization.html',
  styleUrl: './create-organization.css'
})
export class CreateOrganization {

  private router = inject(Router);
  private organizationService = inject(OrganizationService);

  name = '';

  type: 'MANUFACTURER' | 'DISTRIBUTOR' = 'MANUFACTURER';

  loading = false;

  errorMessage = '';

  successMessage = '';


  createOrganization(): void {

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.name.trim()) {

      this.errorMessage =
        'Please enter an organization name.';

      return;
    }

    if (!this.type) {

      this.errorMessage =
        'Please select an organization type.';

      return;
    }

    this.loading = true;

    const request: CreateOrganizationRequest = {

      name: this.name.trim(),

      type: this.type

    };

    this.organizationService
      .createOrganization(request)
      .subscribe({

        next: (organization: Organization) => {

          this.loading = false;

          this.successMessage =
            `Organization "${organization.name}" created successfully.`;

          this.name = '';

          this.type = 'MANUFACTURER';

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


  cancel(): void {

    this.router.navigate([
      '/organizations'
    ]);

  }

}
