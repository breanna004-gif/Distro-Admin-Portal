import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { OrganizationService } from '../../services/organization';
import { UsersService } from '../../services/users';
import { Organizations } from './organizations';

describe('Organizations directory', () => {
  let directoryType: 'MANUFACTURER' | 'DISTRIBUTOR';
  const manufacturer = {
    id: 'manufacturer-1',
    name: 'Northwind Manufacturing',
    email: 'contact@northwind.example',
    type: 'MANUFACTURER' as const,
    status: 'ACTIVE' as const
  };
  const distributor = {
    id: 'distributor-1',
    name: 'Northwind Distribution',
    email: 'team@northwind.example',
    type: 'DISTRIBUTOR' as const,
    status: 'ACTIVE' as const
  };
  const getManufacturers = vi.fn(() => of([manufacturer]));
  const getManufacturer = vi.fn((id: string) => of({ ...manufacturer, id }));
  const getDistributors = vi.fn(() => of([distributor]));
  const getDistributor = vi.fn((id: string) => of({ ...distributor, id }));
  const getUsersForOrganization = vi.fn(() => of([{
    id: 'manager-1',
    name: 'Terry Manager',
    email: 'terry@northwind.example',
    role: 'DISTRIBUTOR_ADMIN' as const,
    status: 'ACTIVE' as const,
    otpDeliveryStatus: 'SENT',
    activationLinkDeliveryStatus: 'DELIVERED'
  }]));

  beforeEach(() => {
    directoryType = 'DISTRIBUTOR';
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [Organizations],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              get data() {
                return { organizationType: directoryType };
              }
            }
          }
        },
        {
          provide: OrganizationService,
          useValue: {
            getManufacturers,
            getManufacturer,
            getDistributors,
            getDistributor
          }
        },
        {
          provide: UsersService,
          useValue: {
            getUsersForOrganization,
            updateUserStatus: vi.fn()
          }
        }
      ]
    });
  });

  it('loads the manufacturer directory from the manufacturers endpoint', async () => {
    directoryType = 'MANUFACTURER';
    const fixture = TestBed.createComponent(Organizations);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(getManufacturers).toHaveBeenCalledOnce();
    expect(getDistributors).not.toHaveBeenCalled();
    expect(fixture.componentInstance.organizations.map(item => item.id))
      .toEqual(['manufacturer-1']);
    expect(fixture.componentInstance.organizations[0].type).toBe('MANUFACTURER');
  });

  it('loads the distributor directory from the distributors endpoint', async () => {
    const fixture = TestBed.createComponent(Organizations);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(getDistributors).toHaveBeenCalledOnce();
    expect(getManufacturers).not.toHaveBeenCalled();
    expect(fixture.componentInstance.organizations.map(item => item.id))
      .toEqual(['distributor-1']);
    expect(fixture.componentInstance.organizations[0].type).toBe('DISTRIBUTOR');
  });

  it('loads detail from the matching type-specific endpoint', () => {
    const fixture = TestBed.createComponent(Organizations);
    const component = fixture.componentInstance;
    component.ngOnInit();

    component.viewOrganization('distributor-1');

    expect(getDistributor).toHaveBeenCalledWith('distributor-1');
    expect(getManufacturer).not.toHaveBeenCalled();
    expect(component.selectedOrganization?.email).toBe('team@northwind.example');
    expect(component.organizationUsers[0].name).toBe('Terry Manager');
  });

  it('does not render create or status actions without matching APIs', async () => {
    const fixture = TestBed.createComponent(Organizations);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Add Distributor');
    expect(fixture.nativeElement.textContent).not.toContain('Deactivate');
    expect(fixture.nativeElement.textContent).toContain('View');
  });
});
