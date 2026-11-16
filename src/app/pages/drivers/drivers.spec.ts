import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { DriverManagementService } from '../../services/driver-management.service';
import { Driver } from '../../models/driver.model';
import { Drivers } from './drivers';

describe('Drivers', () => {
  let component: Drivers;
  let fixture: ComponentFixture<Drivers>;
  let getDriverById: ReturnType<typeof vi.fn>;
  const driver: Driver = {
    id: 'driver-1',
    fullName: 'Alex Driver',
    email: 'alex@example.com',
    phone: '+254700000000',
    licenceNumber: 'DL-12345',
    licenceExpiry: '2027-12-31',
    nationalId: 'ID-123',
    status: 'PENDING',
    createdAt: '2026-11-03T00:00:00Z',
    notes: '',
    authorizations: [],
    onboarding: {
      status: 'INVITATION_PENDING',
      smsDeliveryStatus: 'QUEUED',
      emailDeliveryStatus: 'QUEUED'
    }
  };

  beforeEach(async () => {
    getDriverById = vi.fn(() => of(driver));

    await TestBed.configureTestingModule({
      imports: [Drivers],
      providers: [{
        provide: DriverManagementService,
        useValue: {
          getDrivers: () => of([driver]),
          getDriverById
        }
      }]
    }).compileComponents();

    fixture = TestBed.createComponent(Drivers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the full driver record when opening a directory entry', () => {
    component.viewDriver(driver);

    expect(getDriverById).toHaveBeenCalledWith('driver-1');
    expect(component.selectedDriver).toEqual(driver);
    expect(component.loadingDriverDetails).toBe(false);
  });
});
