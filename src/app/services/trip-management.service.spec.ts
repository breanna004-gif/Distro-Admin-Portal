import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { Trip } from '../models/trip.model';
import { TripManagementService } from './trip-management.service';

describe('TripManagementService', () => {
  let service: TripManagementService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TripManagementService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('updates the trip driver through the driver reassignment endpoint', () => {
    let updatedTrip: Trip | undefined;

    service.updateTripDriver('trip-1', 'driver-new').subscribe(trip => {
      updatedTrip = trip;
    });

    const request = httpTesting.expectOne('/api/v1/trips/trip-1/driver');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ driverId: 'driver-new' });
    request.flush({
      id: 'trip-1',
      tripNumber: 'TRIP-001',
      status: 'SCHEDULED',
      riderId: 'driver-old',
      driverName: 'Replacement Driver',
      shipmentReferences: ['SHP-001']
    });

    expect(updatedTrip).toMatchObject({
      id: 'trip-1',
      driverId: 'driver-new',
      driverName: 'Replacement Driver',
      shipmentReferences: ['SHP-001']
    });
  });

  it('deletes a trip by id', () => {
    service.deleteTrip('trip-1').subscribe();

    const request = httpTesting.expectOne('/api/v1/trips/trip-1');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
