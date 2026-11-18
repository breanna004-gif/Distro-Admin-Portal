import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { OrganizationService, Organization } from '../../services/organization';
import { UsersService } from '../../services/users';
import { User, UserStatus } from '../../models/user.model';
import { ReportColumn, ReportRow } from '../../models/report.model';
import { ReportDownload } from '../../shared/components/report-download/report-download';


@Component({
  selector: 'app-organizations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReportDownload
  ],
  templateUrl: './organizations.html',
  styleUrl: './organizations.css'
})
export class Organizations implements OnInit {
  readonly reportColumns: ReportColumn[] = [
    { key: 'name', header: 'Organization' },
    { key: 'type', header: 'Type' },
    { key: 'contactName', header: 'Contact' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'location', header: 'Location' },
    { key: 'userCount', header: 'Users' },
    { key: 'status', header: 'Status' },
    { key: 'createdAt', header: 'Created' }
  ];

  private organizationService =
    inject(OrganizationService);
  private usersService = inject(UsersService);
  private changeDetectorRef =
    inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);


  // ============================================================
  // ORGANIZATIONS
  // ============================================================

  organizations: Organization[] = [];

  allOrganizations: Organization[] = [];

  get reportData(): ReportRow[] {
    return this.organizations.map(organization => ({
      name: organization.name,
      type: organization.type,
      contactName: organization.contactName,
      email: organization.email,
      phone: organization.phone,
      location: organization.location,
      userCount: organization.userCount,
      status: organization.status,
      createdAt: organization.createdAt
    }));
  }

  loading = false;

  errorMessage = '';


  // ============================================================
  // SEARCH / FILTERS
  // ============================================================

  searchTerm = '';

  organizationType: 'MANUFACTURER' | 'DISTRIBUTOR' = 'MANUFACTURER';


  // ============================================================
  // PAGINATION
  // ============================================================

  currentPage = 0;

  pageSize = 20;

  totalElements = 0;

  totalPages = 1;


  // ============================================================
  // VIEW ORGANIZATION
  // ============================================================

  showViewOrganizationModal = false;

  selectedOrganization: Organization | null = null;
  organizationUsers: User[] = [];
  loadingOrganizationUsers = false;
  organizationUsersError = '';
  memberActionUserId: string | null = null;
  memberActionError = '';

  loadingOrganization = false;

  viewOrganizationError = '';

  // ============================================================
  // INITIALIZATION
  // ============================================================

  ngOnInit(): void {
    this.organizationType =
      this.route.snapshot.data['organizationType'] === 'DISTRIBUTOR'
        ? 'DISTRIBUTOR'
        : 'MANUFACTURER';
    this.loadOrganizations();
  }


  // ============================================================
  // LOAD ORGANIZATIONS
  // ============================================================

  loadOrganizations(): void {

    this.loading = true;
    this.errorMessage = '';

    const request = this.organizationType === 'MANUFACTURER'
      ? this.organizationService.getManufacturers()
      : this.organizationService.getDistributors();

    request
      .subscribe({
        next: (response: Organization[]) => {

          this.allOrganizations =
            response.map((organization: Organization) => ({
              ...organization,

              status:
                organization.status,

              userCount:
                organization.userCount ?? 0,

              productCount:
                organization.productCount ?? 0
            }));

          this.applyFilters();

          this.loading = false;
          this.changeDetectorRef.markForCheck();
        },

        error: (error: any) => {

          console.error(
            `Failed to load ${this.organizationType.toLowerCase()}s:`,
            error
          );

          this.loading = false;

          if (error?.status === 401) {

            this.errorMessage =
              'Your session has expired. Please log in again.';

          } else if (error?.status === 403) {

            this.errorMessage =
              `You do not have permission to view ${this.organizationType.toLowerCase()}s.`;

          } else {

            this.errorMessage =
              `Unable to load ${this.organizationType.toLowerCase()}s. Please try again.`;
          }
          this.changeDetectorRef.markForCheck();
        }
      });
  }


  // ============================================================
  // APPLY SEARCH + FILTERS
  // ============================================================

  applyFilters(): void {

    let filtered: Organization[] = this.allOrganizations.filter(
      organization => organization.type === this.organizationType
    );


    // SEARCH

    if (this.searchTerm.trim()) {

      const search =
        this.searchTerm
          .toLowerCase()
          .trim();

      filtered =
        filtered.filter(
          (organization: Organization) =>

            organization.name
              .toLowerCase()
              .includes(search)

            ||

            (organization.contactName ?? '')
              .toLowerCase()
              .includes(search)

            ||

            organization.type
              .toLowerCase()
              .includes(search)

            ||

            (organization.location ?? '')
              .toLowerCase()
              .includes(search)

            ||

            (organization.email ?? '')
              .toLowerCase()
              .includes(search)
        );
    }


    this.organizations =
      filtered;


    this.totalElements =
      filtered.length;


    this.totalPages =
      Math.max(
        1,
        Math.ceil(
          filtered.length / this.pageSize
        )
      );
  }


  // ============================================================
  // SEARCH
  // ============================================================

  searchOrganizations(): void {

    this.currentPage = 0;

    this.applyFilters();
  }


  getMemberRoleLabel(role: string): string {
    return role
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }

  setMemberStatus(member: User, status: UserStatus): void {
    if (
      this.memberActionUserId ||
      member.role === 'SUPER_ADMIN' ||
      member.role === 'PLATFORM_ADMIN'
    ) {
      return;
    }

    this.memberActionUserId = member.id;
    this.memberActionError = '';

    this.usersService
      .updateUserStatus(member.id, status)
      .subscribe({
        next: updatedUser => {
          this.organizationUsers = this.organizationUsers.map(user =>
            user.id === updatedUser.id ? updatedUser : user
          );
          this.memberActionUserId = null;
          this.changeDetectorRef.markForCheck();
        },
        error: error => {
          console.error('Failed to update organization member status:', error);
          this.memberActionError =
            error?.error?.message ||
            'Unable to update member status. Please try again.';
          this.memberActionUserId = null;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  // ============================================================
  // PAGINATION
  // ============================================================

  nextPage(): void {

    if (
      this.currentPage <
      this.totalPages - 1
    ) {

      this.currentPage++;
    }
  }


  previousPage(): void {

    if (this.currentPage > 0) {

      this.currentPage--;
    }
  }


  addOrganizationUser(organization: Organization): void {
    if (
      organization.type !== 'MANUFACTURER' &&
      organization.type !== 'DISTRIBUTOR'
    ) {
      return;
    }

    void this.router.navigate(['/invite-user'], {
      queryParams: {
        organizationId: organization.id,
        organizationName: organization.name,
        organizationType: organization.type
      }
    });
  }


  // ============================================================
  // VIEW ORGANIZATION
  // ============================================================

  viewOrganization(
    organizationId: string
  ): void {

    this.viewOrganizationError = '';

    this.selectedOrganization = null;

    this.loadingOrganization = true;

    this.showViewOrganizationModal = true;


    const request = this.organizationType === 'MANUFACTURER'
      ? this.organizationService.getManufacturer(organizationId)
      : this.organizationService.getDistributor(organizationId);

    request
      .subscribe({

        next: (organization: Organization) => {

          this.selectedOrganization = {
            ...organization,

            status:
              organization.status,

            userCount:
              organization.userCount ?? 0,

            productCount:
              organization.productCount ?? 0
          };

          this.loadOrganizationUsers(this.selectedOrganization);

          this.loadingOrganization = false;
          this.changeDetectorRef.markForCheck();
        },

        error: (error: any) => {

          console.error(
            `Failed to load ${this.organizationType.toLowerCase()}:`,
            error
          );

          this.viewOrganizationError =
            error?.error?.message ||
            'Unable to load organization details. Please try again.';

          this.loadingOrganization = false;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  private loadOrganizationUsers(organization: Organization): void {
    this.loadingOrganizationUsers = true;
    this.organizationUsersError = '';
    this.organizationUsers = [];

    this.usersService
      .getUsersForOrganization(organization.id, organization.name)
      .subscribe({
        next: users => {
          this.organizationUsers = users;
          this.loadingOrganizationUsers = false;
          this.changeDetectorRef.markForCheck();
        },
        error: error => {
          console.error('Failed to load organization members:', error);
          this.organizationUsersError =
            error?.error?.message ||
            'Unable to load organization members.';
          this.loadingOrganizationUsers = false;
          this.changeDetectorRef.markForCheck();
        }
      });
  }


  // ============================================================
  // CLOSE VIEW ORGANIZATION
  // ============================================================

  closeViewOrganizationModal(): void {

    if (this.loadingOrganization) {
      return;
    }

    this.showViewOrganizationModal = false;

    this.selectedOrganization = null;

    this.viewOrganizationError = '';
  }

}
