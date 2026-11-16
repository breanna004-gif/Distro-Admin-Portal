import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  UsersService
} from '../../services/users';

import {
  User,
  UserRole,
  UserStatus
} from '../../models/user.model';
import { AuthService } from '../../services/auth';


@Component({
  selector: 'app-users',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './users.html',

  styleUrl: './users.css'
})
export class Users implements OnInit {

  private usersService = inject(UsersService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private authService = inject(AuthService);


  // ============================================================
  // DATA
  // ============================================================

  allUsers: User[] = [];

  users: User[] = [];
  totalSystemUsers = 0;


  // ============================================================
  // STATE
  // ============================================================

  loading = false;

  errorMessage = '';

  actionLoading = false;

  actionUserId: string | null = null;

  deleteLoadingUserId: string | null = null;


  // ============================================================
  // SEARCH
  // ============================================================

  searchTerm = '';


  // ============================================================
  // VIEW USER
  // ============================================================

  showViewUserModal = false;

  selectedUser: User | null = null;

  loadingUser = false;

  viewUserError = '';


  // ============================================================
  // PAGINATION
  // ============================================================

  currentPage = 0;

  pageSize = 10;


  // ============================================================
  // ROLE OPTIONS
  // ============================================================

  roleOptions: {
    value: string;
    label: string;
  }[] = [

    {
      value: 'SUPER_ADMIN',
      label: 'Super Admin'
    },

    {
      value: 'PLATFORM_ADMIN',
      label: 'Platform Admin'
    },

    {
      value: 'ORGANIZATION_ADMIN',
      label: 'Organization Admin'
    },

    {
      value: 'MANUFACTURER_ADMIN',
      label: 'Manufacturer Admin'
    },

    {
      value: 'MANUFACTURER_STAFF',
      label: 'Manufacturer Staff'
    },

    {
      value: 'DISTRIBUTOR_ADMIN',
      label: 'Distributor Admin'
    },

    {
      value: 'DISTRIBUTOR_STAFF',
      label: 'Distributor Staff'
    },

    {
      value: 'DRIVER',
      label: 'Driver'
    },

    {
      value: 'CUSTOMER',
      label: 'Customer'
    }

  ];

  get isPlatformAdmin(): boolean {
    return this.authService.isPlatformAdmin();
  }

  get visibleUsers(): User[] {
    return this.isPlatformAdmin
      ? this.allUsers
      : this.allUsers.filter(user => user.role === 'CUSTOMER');
  }


  // ============================================================
  // STATUS OPTIONS
  // ============================================================

  statusOptions = [

    {
      value: 'ALL',
      label: 'All Statuses'
    },

    {
      value: 'ACTIVE',
      label: 'Active'
    },

    {
      value: 'DEACTIVATED',
      label: 'Deactivated'
    },

    {
      value: 'SUSPENDED',
      label: 'Suspended'
    },

    {
      value: 'PENDING',
      label: 'Pending'
    }

  ];


  // ============================================================
  // INITIALIZATION
  // ============================================================

  ngOnInit(): void {

    this.loadUsers();

  }


  // ============================================================
  // LOAD USERS FROM BACKEND
  // ============================================================

  loadUsers(): void {

    this.loading = true;

    this.errorMessage = '';


    this.usersService
      .getUsers()
      .subscribe({

        next: (users) => {

          this.allUsers = users;

          this.applyFilters();

          this.loading = false;
          this.changeDetectorRef.markForCheck();

        },

        error: (error) => {

          console.error(
            'Failed to load users:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'Unable to load users. Please try again.';

          this.loading = false;
          this.changeDetectorRef.markForCheck();

        }

      });

    if (this.isPlatformAdmin) {
      this.usersService.getUserCount().subscribe({
        next: total => {
          this.totalSystemUsers = total;
          this.changeDetectorRef.markForCheck();
        },
        error: error => {
          console.error('Failed to load total user count:', error);
          this.totalSystemUsers = this.allUsers.length;
          this.changeDetectorRef.markForCheck();
        }
      });
    }

  }


  // ============================================================
  // FILTER USERS
  // ============================================================

  applyFilters(): void {

    let filteredUsers = [
      ...this.visibleUsers
    ];


    // ----------------------------------------------------------
    // SEARCH
    // ----------------------------------------------------------

    const search =
      this.searchTerm
        .trim()
        .toLowerCase();


    if (search) {

      filteredUsers =
        filteredUsers.filter(user =>

          user.name
            ?.toLowerCase()
            .includes(search)

          ||

          user.email
            ?.toLowerCase()
            .includes(search)

          ||

          user.phone
            ?.toLowerCase()
            .includes(search)

          ||

          user.role
            ?.toLowerCase()
            .includes(search)

          ||

          user.organizationName
            ?.toLowerCase()
            .includes(search)

        );

    }


    // ----------------------------------------------------------
    // STORE FILTERED DATA
    // ----------------------------------------------------------

    this.users = filteredUsers;

    this.currentPage = 0;

  }


  // ============================================================
  // SEARCH
  // ============================================================

  searchUsers(): void {

    this.applyFilters();

  }


  // ============================================================
  // ============================================================
  // PAGINATED USERS
  // ============================================================

  get paginatedUsers(): User[] {

    const start =
      this.currentPage *
      this.pageSize;

    return this.users.slice(
      start,
      start + this.pageSize
    );

  }


  // ============================================================
  // TOTAL PAGES
  // ============================================================

  get totalPages(): number {

    return Math.max(
      1,
      Math.ceil(
        this.users.length /
        this.pageSize
      )
    );

  }


  // ============================================================
  // NEXT PAGE
  // ============================================================

  nextPage(): void {

    if (
      this.currentPage <
      this.totalPages - 1
    ) {

      this.currentPage++;

    }

  }


  // ============================================================
  // PREVIOUS PAGE
  // ============================================================

  previousPage(): void {

    if (
      this.currentPage > 0
    ) {

      this.currentPage--;

    }

  }


  // ============================================================
  // STATUS CLASS
  // ============================================================

  getStatusClass(
    status?: string
  ): string {

    return (
      status ??
      'PENDING'
    )
      .toLowerCase();

  }


  // ============================================================
  // ROLE LABEL
  // ============================================================

  getRoleLabel(
    role?: string
  ): string {

    if (!role) {
      return 'Unknown';
    }


    const option =
      this.roleOptions.find(
        item =>
          item.value === role
      );


    return (
      option?.label ||
      role
        .replace(/_/g, ' ')
        .replace(
          /\b\w/g,
          letter =>
            letter.toUpperCase()
        )
    );

  }


  // ============================================================
  // VIEW USER
  // ============================================================

  viewUser(
    userId: string
  ): void {

    this.viewUserError = '';

    this.selectedUser = null;

    this.loadingUser = true;

    this.showViewUserModal = true;


    this.usersService
      .getUser(userId)
      .subscribe({

        next: (user) => {

          this.selectedUser = user;

          this.loadingUser = false;
          this.changeDetectorRef.markForCheck();

        },

        error: (error) => {

          console.error(
            'Failed to load user:',
            error
          );

          this.viewUserError =
            error?.error?.message ||
            'Unable to load user details.';

          this.loadingUser = false;
          this.changeDetectorRef.markForCheck();

        }

      });

  }


  // ============================================================
  // CLOSE USER MODAL
  // ============================================================

  closeViewUserModal(): void {

    if (this.loadingUser) {
      return;
    }

    this.showViewUserModal = false;

    this.selectedUser = null;

    this.viewUserError = '';

  }


  // ============================================================
  // CHECK PROTECTED USER
  // ============================================================

  isProtectedUser(
    user: User
  ): boolean {

    return (
      user.role === 'SUPER_ADMIN' ||
      user.role === 'PLATFORM_ADMIN'
    );

  }


  // ============================================================
  // ACTIVATE USER
  // ============================================================

  activateUser(
    user: User
  ): void {

    if (
      !this.isPlatformAdmin ||
      this.isProtectedUser(user) ||
      !user.id ||
      this.actionLoading
    ) {
      return;
    }


    this.actionLoading = true;

    this.actionUserId = user.id;


    this.usersService
      .activateUser(user.id)
      .subscribe({

        next: (updatedUser) => {

          this.replaceUser(
            updatedUser
          );

          this.actionLoading = false;

          this.actionUserId = null;
          this.changeDetectorRef.markForCheck();

        },

        error: (error) => {

          console.error(
            'Failed to activate user:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'Unable to activate user.';

          this.actionLoading = false;

          this.actionUserId = null;
          this.changeDetectorRef.markForCheck();

        }

      });

  }


  // ============================================================
  // DEACTIVATE USER
  // ============================================================

  deactivateUser(
    user: User
  ): void {

    if (
      !this.isPlatformAdmin ||
      this.isProtectedUser(user) ||
      !user.id ||
      this.actionLoading
    ) {
      return;
    }


    this.actionLoading = true;

    this.actionUserId = user.id;


    this.usersService
      .deactivateUser(user.id)
      .subscribe({

        next: (updatedUser) => {

          this.replaceUser(
            updatedUser
          );

          this.actionLoading = false;

          this.actionUserId = null;
          this.changeDetectorRef.markForCheck();

        },

        error: (error) => {

          console.error(
            'Failed to deactivate user:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'Unable to deactivate user.';

          this.actionLoading = false;

          this.actionUserId = null;
          this.changeDetectorRef.markForCheck();

        }

      });

  }


  // ============================================================
  // SUSPEND USER
  // ============================================================

  suspendUser(
    user: User
  ): void {

    if (
      !this.isPlatformAdmin ||
      this.isProtectedUser(user) ||
      !user.id ||
      this.actionLoading
    ) {
      return;
    }


    this.actionLoading = true;

    this.actionUserId = user.id;


    this.usersService
      .suspendUser(user.id)
      .subscribe({

        next: (updatedUser) => {

          this.replaceUser(
            updatedUser
          );

          this.actionLoading = false;

          this.actionUserId = null;
          this.changeDetectorRef.markForCheck();

        },

        error: (error) => {

          console.error(
            'Failed to suspend user:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'Unable to suspend user.';

          this.actionLoading = false;

          this.actionUserId = null;
          this.changeDetectorRef.markForCheck();

        }

      });

  }

  deleteUser(user: User): void {
    if (
      this.isPlatformAdmin ||
      this.isProtectedUser(user) ||
      this.actionLoading ||
      this.deleteLoadingUserId
    ) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this user? This cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    this.errorMessage = '';
    this.deleteLoadingUserId = user.id;

    this.usersService
      .deleteUser(user.id)
      .subscribe({
        next: () => {
          this.allUsers = this.allUsers.filter(
            existingUser => existingUser.id !== user.id
          );
          this.applyFilters();
          this.deleteLoadingUserId = null;

          if (this.selectedUser?.id === user.id) {
            this.closeViewUserModal();
          }
          this.changeDetectorRef.markForCheck();
        },
        error: error => {
          console.error('Failed to delete user:', error);
          this.errorMessage =
            error?.status === 405
              ? 'The server does not allow DELETE at this URL. Check the backend-supported user-delete route and method.'
              : error?.error?.message ||
                'Unable to delete user. Please try again.';
          this.deleteLoadingUserId = null;
          this.changeDetectorRef.markForCheck();
        }
      });
  }


  // ============================================================
  // UPDATE LOCAL USER
  // ============================================================

  private replaceUser(
    updatedUser: User
  ): void {

    const index =
      this.allUsers.findIndex(
        user =>
          user.id ===
          updatedUser.id
      );


    if (index !== -1) {

      this.allUsers[index] =
        updatedUser;

    }


    this.applyFilters();


    // Keep modal details synchronized
    if (
      this.selectedUser?.id ===
      updatedUser.id
    ) {

      this.selectedUser =
        updatedUser;

    }

  }


  // ============================================================
  // TRACK USER
  // ============================================================

  trackByUserId(
    index: number,
    user: User
  ): string {

    return user.id;

  }

}
