import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { User } from '../../models/user.model';
import { UsersService } from '../../services/users';
import { AuthService } from '../../services/auth';
import { Users } from './users';

describe('Users', () => {
  let platformAdmin = false;
  const user: User = {
    id: 'user-id',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'CUSTOMER',
    status: 'PENDING'
  };

  let component: Users;
  let deleteUser: ReturnType<typeof vi.fn>;
  let updateUserStatus: ReturnType<typeof vi.fn>;
  let activateUser: ReturnType<typeof vi.fn>;
  let getUsers: ReturnType<typeof vi.fn>;
  let getUserCount: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    platformAdmin = false;
    deleteUser = vi.fn(() => of(undefined));
    updateUserStatus = vi.fn((id: string, status: User['status']) =>
      of({ ...user, id, status })
    );
    activateUser = vi.fn((id: string) =>
      of({ ...user, id, status: 'ACTIVE' as const })
    );
    getUsers = vi.fn(() => of([]));
    getUserCount = vi.fn(() => of(0));
    TestBed.configureTestingModule({
      imports: [Users],
      providers: [
        {
          provide: UsersService,
          useValue: {
            deleteUser,
            getUsers,
            getUserCount,
            updateUserStatus,
            activateUser,
            deactivateUser: vi.fn((id: string) =>
              of({ ...user, id, status: 'DEACTIVATED' as const })
            ),
            suspendUser: vi.fn((id: string) =>
              of({ ...user, id, status: 'SUSPENDED' as const })
            )
          }
        },
        {
          provide: AuthService,
          useValue: { isPlatformAdmin: () => platformAdmin }
        }
      ]
    });

    component = TestBed.createComponent(Users).componentInstance;
  });

  it('confirms deletion and removes the user after success', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.allUsers = [user];
    component.users = [user];

    component.deleteUser(user);

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this user? This cannot be undone.'
    );
    expect(deleteUser).toHaveBeenCalledWith('user-id');
    expect(component.allUsers).toEqual([]);
    expect(component.users).toEqual([]);
  });

  it('does not send the delete request when confirmation is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.deleteUser(user);

    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('explains when the backend does not allow user deletion', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.allUsers = [user];
    component.users = [user];
    deleteUser.mockReturnValue(
      throwError(() => ({ status: 405, error: {} }))
    );

    component.deleteUser(user);

    expect(component.errorMessage).toContain(
      'Check the backend-supported user-delete route and method.'
    );
    expect(component.deleteLoadingUserId).toBeNull();
    expect(component.allUsers).toEqual([user]);
  });

  it('preserves customer-only visibility for non-platform users', () => {
    component.allUsers = [
      user,
      { ...user, id: 'staff-id', role: 'MANUFACTURER_STAFF' },
      { ...user, id: 'driver-id', role: 'DRIVER' }
    ];

    component.applyFilters();

    expect(component.users).toEqual([user]);
  });

  it('lets platform admins view users across every role', () => {
    platformAdmin = true;
    component.allUsers = [
      user,
      { ...user, id: 'admin-id', role: 'SUPER_ADMIN' },
      { ...user, id: 'staff-id', role: 'MANUFACTURER_STAFF' },
      { ...user, id: 'driver-id', role: 'DRIVER' }
    ];
    component.applyFilters();

    component.deleteUser(user);

    expect(component.visibleUsers.map(item => item.id))
      .toEqual(['user-id', 'admin-id', 'staff-id', 'driver-id']);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('loads the system-wide user total separately from the visible page', () => {
    platformAdmin = true;
    getUsers.mockReturnValue(of([user]));
    getUserCount.mockReturnValue(of(42));

    component.loadUsers();

    expect(component.totalSystemUsers).toBe(42);
  });

  it('allows platform admins to activate a customer account only', () => {
    platformAdmin = true;

    component.activateUser(user);
    expect(activateUser).toHaveBeenCalledWith('user-id');

    activateUser.mockClear();
    component.activateUser({ ...user, role: 'SUPER_ADMIN' });
    expect(activateUser).not.toHaveBeenCalled();
  });
});
