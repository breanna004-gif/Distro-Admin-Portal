import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { FleetManagementService } from './fleet-management.service';
import { Vehicle } from '../models/vehicle.model';

describe('FleetManagementService', () => {
  let service: FleetManagementService;
  let httpTesting: HttpTestingController;

  const details: Omit<Vehicle, 'id' | 'createdAt'> = {
    registrationNumber: 'KAA 123A',
    make: 'Isuzu',
    model: 'FVR',
    year: 2024,
    type: 'MEDIUM_TRUCK',
    ownerOrganizationId: 'org-1',
    ownerOrganizationName: 'Northwind',
    maxWeightKg: 5000,
    cargoVolumeM3: 20,
    cargoCategories: ['GENERAL'],
    hasCompartments: false,
    refrigerated: false,
    assignedDriverId: null,
    assignedDriverName: null,
    status: 'AVAILABLE',
    lastServiceDate: '',
    nextServiceDate: '',
    notes: ''
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(FleetManagementService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('registers a vehicle with the organization and capacity fields the backend requires', () => {
    let received: Vehicle | undefined;

    service.registerVehicle(details).subscribe(vehicle => {
      received = vehicle;
    });

    const request = httpTesting.expectOne('/api/v1/vehicles');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      registrationNumber: 'KAA 123A',
      vehicleType: 'MEDIUM_TRUCK',
      make: 'Isuzu',
      model: 'FVR',
      capacityKg: 5000,
      capacityM3: 20,
      organizationId: 'org-1'
    });
    request.flush({
      id: 'vehicle-1',
      organizationId: 'org-1',
      registrationNumber: 'KAA 123A',
      vehicleType: 'MEDIUM_TRUCK',
      make: 'Isuzu',
      model: 'FVR',
      capacityKg: 5000,
      capacityM3: 20,
      status: 'ACTIVE',
      createdAt: '2026-11-18T00:00:00Z'
    });

    expect(received).toMatchObject({
      id: 'vehicle-1',
      ownerOrganizationId: 'org-1',
      type: 'MEDIUM_TRUCK',
      maxWeightKg: 5000,
      cargoVolumeM3: 20,
      status: 'AVAILABLE'
    });
  });
});
