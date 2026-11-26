import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TripManagement } from './trip-management';
import { TripManagementService } from '../../services/trip-management.service';
import { FleetManagementService } from '../../services/fleet-management.service';
import { ShipmentManagementService } from '../../services/shipment-management.service';
import { DriverManagementService } from '../../services/driver-management.service';

describe('TripManagement', () => {
  let component: TripManagement;
  let fixture: ComponentFixture<TripManagement>;
  let tripService: {
    getTrips: ReturnType<typeof vi.fn>;
    createTrip: ReturnType<typeof vi.fn>;
    updateTripDriver: ReturnType<typeof vi.fn>;
    deleteTrip: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    tripService = {
      getTrips: vi.fn().mockReturnValue(of([])),
      createTrip: vi.fn().mockReturnValue(of({ id: 'trip-1' })),
      updateTripDriver: vi.fn().mockReturnValue(of({})),
      deleteTrip: vi.fn().mockReturnValue(of(undefined))
    };

    await TestBed.configureTestingModule({
      imports: [TripManagement],
      providers: [
        { provide: TripManagementService, useValue: tripService },
        {
          provide: FleetManagementService,
          useValue: { getVehicles: vi.fn().mockReturnValue(of([])) }
        },
        {
          provide: ShipmentManagementService,
          useValue: { getShipments: vi.fn().mockReturnValue(of([])) }
        },
        {
          provide: DriverManagementService,
          useValue: { getDrivers: vi.fn().mockReturnValue(of([])) }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TripManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows a success message after creating a trip', () => {
    component.vehicles = [{
      id: 'vehicle-1',
      status: 'AVAILABLE',
      registrationNumber: 'ABC-123',
      maxWeightKg: 1000,
      cargoVolumeM3: 10
    } as TripManagement['vehicles'][number]];
    component.drivers = [{
      id: 'driver-1',
      status: 'APPROVED',
      fullName: 'Test Driver'
    } as TripManagement['drivers'][number]];
    component.shipments = [{
      id: 'shipment-1',
      referenceNumber: 'SHP-001',
      organizationId: 'org-1',
      organizationName: 'Test Organization',
      organizationType: 'DISTRIBUTOR',
      cargoDescription: 'General cargo',
      cargoCategory: 'GENERAL',
      weightKg: 100,
      volumeM3: 1,
      handlingRequirements: [],
      pickupLocation: 'Pickup',
      pickupLatitude: 1,
      pickupLongitude: 1,
      pickupWindowStart: '2026-01-01T09:00:00',
      pickupWindowEnd: '2026-01-01T12:00:00',
      deliveryLocation: 'Delivery',
      deliveryLatitude: 2,
      deliveryLongitude: 2,
      deliveryWindowStart: '2026-01-01T12:00:00',
      deliveryWindowEnd: '2026-01-01T18:00:00',
      status: 'READY',
      sharedLoadAllowed: true,
      specialInstructions: '',
      assignedVehicleId: null,
      assignedVehicleRegistration: null,
      tripId: null,
      createdAt: '2026-01-01T08:00:00'
    } as TripManagement['shipments'][number]];
    component.form = {
      vehicleId: 'vehicle-1',
      driverId: 'driver-1',
      shipmentIds: ['shipment-1'],
      plannedStart: '2026-01-01T10:00',
      plannedEnd: '2026-01-01T14:00',
      distanceKm: 0,
      notes: ''
    };

    component.createTrip();

    expect(tripService.createTrip).toHaveBeenCalled();
    expect(component.feedbackMessage).toBe('Trip added successfully.');
  });

  it('reassigns the trip driver for every linked shipment before transit', () => {
    const trip = {
      id: 'trip-1',
      status: 'SCHEDULED',
      driverId: 'driver-old',
      driverName: 'Current Driver',
      shipmentReferences: ['SHP-001', 'SHP-002']
    } as TripManagement['trips'][number];
    component.trips = [trip];
    component.drivers = [{
      id: 'driver-new',
      fullName: 'Replacement Driver',
      status: 'APPROVED'
    } as TripManagement['drivers'][number]];
    tripService.updateTripDriver.mockReturnValue(of({
      ...trip,
      driverId: 'driver-new',
      driverName: 'Replacement Driver'
    }));

    component.openDetails(trip);
    component.reassignmentDriverId = 'driver-new';
    component.reassignDriver();

    expect(tripService.updateTripDriver).toHaveBeenCalledWith(
      'trip-1',
      'driver-new'
    );
    expect(component.trips[0].driverId).toBe('driver-new');
    expect(component.trips[0].shipmentReferences).toEqual([
      'SHP-001',
      'SHP-002'
    ]);
    expect(component.selectedTrip?.driverName).toBe('Replacement Driver');
  });

  it('does not allow driver reassignment after a trip enters transit', () => {
    const trip = {
      id: 'trip-1',
      status: 'IN_TRANSIT',
      driverId: 'driver-old',
      driverName: 'Current Driver',
      shipmentReferences: ['SHP-001']
    } as TripManagement['trips'][number];
    component.selectedTrip = trip;
    component.reassignmentDriverId = 'driver-new';

    component.reassignDriver();

    expect(tripService.updateTripDriver).not.toHaveBeenCalled();
    expect(component.feedbackMessage).toContain('before the trip enters transit');
  });

  it('confirms deletion of a scheduled trip and removes it after success', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const trip = {
      id: 'trip-1',
      referenceNumber: 'TRIP-001',
      status: 'SCHEDULED',
      shipmentReferences: ['SHP-001']
    } as TripManagement['trips'][number];
    component.trips = [trip];
    component.selectedTrip = trip;

    component.deleteTrip(trip);

    expect(window.confirm).toHaveBeenCalled();
    expect(tripService.deleteTrip).toHaveBeenCalledWith('trip-1');
    expect(component.trips).toEqual([]);
    expect(component.selectedTrip).toBeNull();
    expect(component.feedbackMessage).toContain('returned to READY');
  });

  it('does not delete a dispatched trip', () => {
    const trip = {
      id: 'trip-1',
      referenceNumber: 'TRIP-001',
      status: 'DISPATCHED',
      shipmentReferences: ['SHP-001']
    } as TripManagement['trips'][number];

    component.deleteTrip(trip);

    expect(tripService.deleteTrip).not.toHaveBeenCalled();
    expect(component.feedbackMessage).toContain('Only planned or scheduled');
  });
});
