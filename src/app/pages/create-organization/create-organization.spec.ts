import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Organization, OrganizationService } from '../../services/organization';
import { AccessRequestService } from '../../services/access-request';
import { NotificationsService } from '../../services/notifications';
import { InvitationService } from '../../services/invitations';
import { CreateOrganization } from './create-organization';

describe('CreateOrganization', () => {
  let selectedType: 'MANUFACTURER' | 'DISTRIBUTOR';
  let createManufacturer: ReturnType<typeof vi.fn>;
  let createDistributor: ReturnType<typeof vi.fn>;
  let submitRequest: ReturnType<typeof vi.fn>;
  let refreshUnreadCount: ReturnType<typeof vi.fn>;
  let inviteUser: ReturnType<typeof vi.fn>;

  const manufacturer: Organization = {
    id: 'manufacturer-1',
    name: 'Northwind Manufacturing',
    type: 'MANUFACTURER'
  };
  const distributor: Organization = {
    id: 'distributor-1',
    name: 'Northwind Distribution',
    type: 'DISTRIBUTOR'
  };

  beforeEach(() => {
    selectedType = 'MANUFACTURER';
    createManufacturer = vi.fn(() => of(manufacturer));
    createDistributor = vi.fn(() => of(distributor));
    submitRequest = vi.fn(() => of({ message: 'Access request submitted.' }));
    refreshUnreadCount = vi.fn(() => of(1));
    inviteUser = vi.fn(() => of({ message: 'Invitation email sent.' }));

    TestBed.configureTestingModule({
      imports: [CreateOrganization],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => selectedType
              }
            }
          }
        },
        {
          provide: OrganizationService,
          useValue: {
            createManufacturer,
            createDistributor
          }
        },
        {
          provide: AccessRequestService,
          useValue: { submitRequest }
        },
        {
          provide: NotificationsService,
          useValue: { refreshUnreadCount }
        },
        {
          provide: InvitationService,
          useValue: { inviteUser }
        }
      ]
    });
  });

  it('creates a manufacturer and submits its admin access request', () => {
    const fixture = TestBed.createComponent(CreateOrganization);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.name = 'Northwind Manufacturing';
    component.contactName = '  Terry Manager ';
    component.email = '  terry@northwind.example ';
    component.phone = '+254700000000';
    component.location = 'Nairobi';

    component.createOrganization();

    expect(createManufacturer).toHaveBeenCalledWith({
      name: 'Northwind Manufacturing',
      contactName: 'Terry Manager',
      email: 'terry@northwind.example',
      phone: '+254700000000',
      location: 'Nairobi'
    });
    expect(submitRequest).toHaveBeenCalledWith({
      fullName: 'Terry Manager',
      email: 'terry@northwind.example',
      phoneNumber: '+254700000000',
      organizationName: 'Northwind Manufacturing',
      organizationType: 'MANUFACTURER',
      requestedRole: 'MANUFACTURER_ADMIN'
    });
    expect(inviteUser).toHaveBeenCalledWith({
      fullName: 'Terry Manager',
      email: 'terry@northwind.example',
      phoneNumber: '+254700000000',
      role: 'MANUFACTURER_ADMIN',
      organizationId: 'manufacturer-1'
    });
    expect(refreshUnreadCount).toHaveBeenCalledOnce();
  });

  it('submits a distributor admin access request', () => {
    selectedType = 'DISTRIBUTOR';
    const fixture = TestBed.createComponent(CreateOrganization);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.name = 'Northwind Distribution';
    component.contactName = 'Drew Manager';
    component.email = 'drew@northwind.example';
    component.phone = '+254711111111';

    component.createOrganization();

    expect(createDistributor).toHaveBeenCalledOnce();
    expect(createManufacturer).not.toHaveBeenCalled();
    expect(submitRequest).toHaveBeenCalledWith({
      fullName: 'Drew Manager',
      email: 'drew@northwind.example',
      phoneNumber: '+254711111111',
      organizationName: 'Northwind Distribution',
      organizationType: 'DISTRIBUTOR',
      requestedRole: 'DISTRIBUTOR_ADMIN'
    });
    expect(inviteUser).toHaveBeenCalledWith({
      fullName: 'Drew Manager',
      email: 'drew@northwind.example',
      phoneNumber: '+254711111111',
      role: 'DISTRIBUTOR_ADMIN',
      organizationId: 'distributor-1'
    });
  });

  it('retries a failed access request before sending the invitation', () => {
    submitRequest
      .mockReturnValueOnce(throwError(() => ({
        error: { message: 'Request service unavailable.' }
      })))
      .mockReturnValueOnce(of({
        message: 'Access request submitted.'
      }));

    const fixture = TestBed.createComponent(CreateOrganization);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.name = 'Northwind Manufacturing';
    component.contactName = 'Terry Manager';
    component.email = 'terry@northwind.example';
    component.phone = '+254700000000';

    component.createOrganization();

    expect(component.createdOrganization?.id).toBe('manufacturer-1');
    expect(component.requestErrorMessage).toBe('Request service unavailable.');
    expect(inviteUser).not.toHaveBeenCalled();

    component.retryAccessRequest();

    expect(createManufacturer).toHaveBeenCalledOnce();
    expect(submitRequest).toHaveBeenCalledTimes(2);
    expect(component.requestErrorMessage).toBe('');
    expect(inviteUser).toHaveBeenCalledOnce();
  });

  it('retries a failed email invitation without resubmitting the access request', () => {
    inviteUser
      .mockReturnValueOnce(throwError(() => ({
        error: { message: 'Email service unavailable.' }
      })))
      .mockReturnValueOnce(of({
        message: 'Invitation email sent.'
      }));

    const fixture = TestBed.createComponent(CreateOrganization);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.name = 'Northwind Manufacturing';
    component.contactName = 'Terry Manager';
    component.email = 'terry@northwind.example';
    component.phone = '+254700000000';

    component.createOrganization();

    expect(component.accessRequestSubmitted).toBe(true);
    expect(component.invitationErrorMessage).toBe('Email service unavailable.');

    component.retryInvitation();

    expect(createManufacturer).toHaveBeenCalledOnce();
    expect(submitRequest).toHaveBeenCalledOnce();
    expect(inviteUser).toHaveBeenCalledTimes(2);
    expect(component.invitationErrorMessage).toBe('');
    expect(component.invitationSent).toBe(true);
  });
});
