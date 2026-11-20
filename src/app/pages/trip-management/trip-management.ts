
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Trip, TripStatus, StopStatus } from '../../models/trip.model';
import { Vehicle } from '../../models/vehicle.model';
import { Shipment } from '../../models/shipment.model';
import { Driver } from '../../models/driver.model';

import { TripManagementService } from '../../services/trip-management.service';
import { HttpErrorResponse } from '@angular/common/http';
import { FleetManagementService } from '../../services/fleet-management.service';
import { ShipmentManagementService } from '../../services/shipment-management.service';
import { DriverManagementService } from '../../services/driver-management.service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-trip-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trip-management.html',
  styleUrl: './trip-management.css'
})
export class TripManagement implements OnInit {
  trips: Trip[] = [];
  vehicles: Vehicle[] = [];
  drivers: Driver[] = [];
  shipments: Shipment[] = [];

  searchTerm = '';
  selectedTrip: Trip | null = null;
  showCreateForm = false;
  feedbackMessage = '';
  volumeDraft: number | null = null;

  form = {
    vehicleId: '',
    driverId: '',
    shipmentIds: [] as string[],
    plannedStart: '',
    plannedEnd: '',
    distanceKm: 0,
    notes: ''
  };

  constructor(
    private tripService: TripManagementService,
    private fleetService: FleetManagementService,
    private shipmentService: ShipmentManagementService,
    private driverService: DriverManagementService,
    private authService: AuthService
  ) {}

  get isSuperAdmin(): boolean {
    return this.authService.isPlatformAdmin();
  }

  ngOnInit(): void {
    this.loadTrips();
    this.loadResources();
  }

  loadTrips(): void {
    this.tripService.getTrips().subscribe({
      next: trips => {
        this.trips = trips;
        if (this.selectedTrip) {
          this.selectedTrip =
            trips.find(trip => trip.id === this.selectedTrip?.id) ?? null;
        }
      },
      error: () => {
        this.feedbackMessage = 'Unable to load trips. Please try again.';
      }
    });
  }

  loadResources(): void {
    this.fleetService.getVehicles().subscribe({
      next: vehicles => {
        this.vehicles = vehicles;
      },
      error: () => {
        this.feedbackMessage = 'Unable to load vehicles. Please try again.';
      }
    });
    this.driverService.getDrivers().subscribe({
      next: drivers => {
        this.drivers = drivers;
      },
      error: () => {
        this.feedbackMessage = 'Unable to load drivers. Please try again.';
      }
    });
    this.shipmentService.getShipments().subscribe({
      next: shipments => {
        this.shipments = shipments;
      },
      error: () => {
        this.feedbackMessage = 'Unable to load shipments. Please try again.';
      }
    });
  }

  get availableVehicles(): Vehicle[] {
    return this.vehicles.filter(vehicle => vehicle.status === 'AVAILABLE');
  }

  get eligibleDrivers(): Driver[] {
    return this.drivers.filter(driver => driver.status === 'APPROVED');
  }

  get eligibleShipments(): Shipment[] {
    return this.shipments.filter(shipment =>
      shipment.status === 'READY' &&
      !shipment.tripId &&
      !shipment.assignedVehicleId
    );
  }

  get selectedVehicle(): Vehicle | undefined {
    return this.vehicles.find(vehicle => vehicle.id === this.form.vehicleId);
  }

  get selectedShipments(): Shipment[] {
    return this.shipments.filter(shipment =>
      this.form.shipmentIds.includes(shipment.id)
    );
  }

  get selectedTotalWeightKg(): number {
    return this.selectedShipments.reduce(
      (total, shipment) => total + shipment.weightKg,
      0
    );
  }

  get selectedTotalVolumeM3(): number {
    return this.selectedShipments.reduce(
      (total, shipment) => total + shipment.volumeM3,
      0
    );
  }

  get capacityWarning(): string {
    const vehicle = this.selectedVehicle;

    if (!vehicle || !this.selectedShipments.length) {
      return '';
    }

    if (this.selectedTotalWeightKg > vehicle.maxWeightKg) {
      return 'Selected shipments exceed the vehicle weight capacity.';
    }

    if (!vehicle.cargoVolumeM3) {
      return 'This vehicle has no cargo volume saved. Enter the volume from registration.';
    }

    if (this.selectedTotalVolumeM3 > vehicle.cargoVolumeM3) {
      return 'Selected shipments exceed the vehicle cargo volume.';
    }

    return '';
  }

  saveVehicleVolume(): void {
    const vehicle = this.selectedVehicle;
    const volume = Number(this.volumeDraft);

    if (!vehicle) {
      return;
    }

    if (!Number.isFinite(volume) || volume <= 0) {
      this.feedbackMessage = 'Enter a cargo volume greater than 0.';
      return;
    }

    this.fleetService.updateCargoVolume(vehicle.id, volume).subscribe({
      next: updated => {
        const savedVolume = updated.cargoVolumeM3 > 0 ? updated.cargoVolumeM3 : volume;
        this.vehicles = this.vehicles.map(item =>
          item.id === vehicle.id
            ? {
                ...item,
                ...updated,
                cargoVolumeM3: savedVolume,
                ownerOrganizationName: item.ownerOrganizationName || updated.ownerOrganizationName
              }
            : item
        );
        this.volumeDraft = savedVolume;
        this.feedbackMessage = '';
      },
      error: () => {
        this.feedbackMessage = 'The cargo volume could not be saved.';
      }
    });
  }

  get cargoCompatibilityWarning(): string {
    const selected = this.selectedShipments;

    if (selected.length < 2) {
      return '';
    }

    const categories = selected.map(shipment => shipment.cargoCategory);
    const handling = selected.flatMap(
      shipment => shipment.handlingRequirements ?? []
    );

    if (categories.includes('HAZARDOUS')) {
      return 'Hazardous cargo requires a separate compatibility and safety review before combining shipments.';
    }

    if (
      categories.includes('FOOD') &&
      (categories.includes('GENERAL') ||
        categories.includes('CONSTRUCTION'))
    ) {
      return 'Food cargo combined with general or construction cargo requires a compatibility review.';
    }

    if (
      categories.includes('PERISHABLE') &&
      (categories.includes('GENERAL') ||
        categories.includes('CONSTRUCTION') ||
        categories.includes('LIQUID'))
    ) {
      return 'Perishable cargo cannot be combined with these selected cargo categories without a compatibility review.';
    }

    if (
      categories.includes('FRAGILE') &&
      (categories.includes('CONSTRUCTION') ||
        categories.includes('LIQUID'))
    ) {
      return 'Fragile cargo combined with construction materials or liquids requires a compatibility review.';
    }

    if (
      handling.includes('HAZARDOUS_HANDLING') &&
      selected.length > 1
    ) {
      return 'Hazardous handling requirements need review before combining shipments.';
    }

      return '';
  }

  get schedulingWarning(): string {
    if (
      !this.form.vehicleId ||
      !this.form.driverId ||
      !this.form.plannedStart ||
      !this.form.plannedEnd
    ) {
      return '';
    }

    const start = new Date(this.form.plannedStart).getTime();
    const end = new Date(this.form.plannedEnd).getTime();

    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      end <= start
    ) {
      return 'Enter a valid trip start and end time.';
    }

    const conflictingTrip = this.trips.find(trip => {
      if (['CANCELLED', 'COMPLETED'].includes(trip.status)) {
        return false;
      }

      const otherStart = new Date(trip.plannedStart).getTime();
      const otherEnd = new Date(trip.plannedEnd).getTime();

      if (
        !Number.isFinite(otherStart) ||
        !Number.isFinite(otherEnd)
      ) {
        return false;
      }

      const overlaps = start < otherEnd && end > otherStart;
      const sameVehicle = trip.vehicleId === this.form.vehicleId;
      const sameDriver = trip.driverId === this.form.driverId;

      return overlaps && (sameVehicle || sameDriver);
    });

    if (conflictingTrip) {
      return `Scheduling conflict with ${conflictingTrip.referenceNumber}: the selected vehicle or driver is already assigned during this period.`;
    }

    return '';
  }

  get shipmentWindowWarning(): string {
    if (!this.form.plannedStart || !this.form.plannedEnd) {
      return '';
    }

    const tripStart = new Date(this.form.plannedStart).getTime();
    const tripEnd = new Date(this.form.plannedEnd).getTime();

    for (const shipment of this.selectedShipments) {
      const pickupStart = new Date(shipment.pickupWindowStart).getTime();
      const pickupEnd = new Date(shipment.pickupWindowEnd).getTime();
      const deliveryStart = new Date(shipment.deliveryWindowStart).getTime();
      const deliveryEnd = new Date(shipment.deliveryWindowEnd).getTime();

      if (
        Number.isFinite(pickupStart) &&
        Number.isFinite(pickupEnd) &&
        (tripStart > pickupEnd || tripEnd < pickupStart)
      ) {
        return `${shipment.referenceNumber}: the planned trip does not fit the pickup window.`;
      }

      if (
        Number.isFinite(deliveryStart) &&
        Number.isFinite(deliveryEnd) &&
        (tripEnd < deliveryStart || tripEnd > deliveryEnd)
      ) {
        return `${shipment.referenceNumber}: check the planned trip end against the delivery window.`;
      }
    }

    return '';
  }

  replacementDriverId = '';

  toggleShipment(shipmentId: string, checked: boolean): void {
    if (checked) {
      if (!this.form.shipmentIds.includes(shipmentId)) {
        this.form.shipmentIds = [
          ...this.form.shipmentIds,
          shipmentId
        ];
      }
    } else {
      this.form.shipmentIds = this.form.shipmentIds.filter(
        id => id !== shipmentId
      );
    }
    this.fillScheduleFromShipments();
  }

  private fillScheduleFromShipments(): void {
    const selected = this.selectedShipments;
    if (selected.length === 0) {
      this.form.plannedStart = '';
      this.form.plannedEnd = '';
      return;
    }

    const starts = selected
      .map(shipment => this.toLocalInput(shipment.pickupWindowStart || shipment.createdAt))
      .filter(value => value);
    const ends = selected
      .map(shipment => this.toLocalInput(shipment.deliveryWindowEnd || shipment.createdAt))
      .filter(value => value);
    this.form.plannedStart = starts.sort()[0] ?? '';
    this.form.plannedEnd = ends.sort().at(-1) ?? '';
    if (this.form.plannedStart && this.form.plannedEnd
        && this.form.plannedEnd <= this.form.plannedStart) {
      const end = new Date(this.form.plannedStart);
      end.setHours(end.getHours() + 1);
      this.form.plannedEnd = this.toLocalInput(end.toISOString());
    }
  }

  private toLocalInput(value: string): string {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) {
      return '';
    }
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  get filteredTrips(): Trip[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.trips.filter(trip => {
      const matchesSearch =
        !term ||
        trip.referenceNumber.toLowerCase().includes(term) ||
        trip.vehicleRegistration.toLowerCase().includes(term) ||
        trip.driverName.toLowerCase().includes(term) ||
        trip.shipmentReferences.some(ref =>
          ref.toLowerCase().includes(term)
        ) ||
        trip.stops.some(stop =>
          stop.location.toLowerCase().includes(term)
        );

      return matchesSearch;
    });
  }

  get activeTrips(): number {
    return this.trips.filter(trip =>
      ['DISPATCHED', 'IN_TRANSIT'].includes(trip.status)
    ).length;
  }

  get plannedTrips(): number {
    return this.trips.filter(trip =>
      ['PLANNED', 'SCHEDULED'].includes(trip.status)
    ).length;
  }

  get completedTrips(): number {
    return this.trips.filter(trip =>
      trip.status === 'COMPLETED'
    ).length;
  }

  get totalShipments(): number {
    return this.trips.reduce(
      (total, trip) => total + trip.shipmentReferences.length,
      0
    );
  }

  openDetails(trip: Trip): void {
    this.selectedTrip = trip;
    this.replacementDriverId = trip.driverId;
    this.feedbackMessage = '';
  }

  closeDetails(): void {
    this.selectedTrip = null;
    this.feedbackMessage = '';
  }

  openCreateForm(): void {
    this.loadResources();

    this.form = {
      vehicleId: '',
      driverId: '',
      shipmentIds: [],
      plannedStart: '',
      plannedEnd: '',
      distanceKm: 0,
      notes: ''
    };

    this.feedbackMessage = '';
    this.showCreateForm = true;
  }

  closeCreateForm(): void {
    this.showCreateForm = false;
    this.feedbackMessage = '';
  }

  createTrip(): void {
    if (!this.form.vehicleId) {
      this.feedbackMessage = 'Please select a vehicle.';
      return;
    }

    if (!this.form.driverId) {
      this.feedbackMessage = 'Please select an approved driver.';
      return;
    }

    if (this.form.shipmentIds.length === 0) {
      this.feedbackMessage = 'Please select at least one shipment.';
      return;
    }

    if (!this.form.plannedStart || !this.form.plannedEnd) {
      this.feedbackMessage =
        'The selected shipment has no pickup or delivery time to use.';
      return;
    }

    const start = new Date(this.form.plannedStart).getTime();
    const end = new Date(this.form.plannedEnd).getTime();

    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      end <= start
    ) {
      this.feedbackMessage =
        'Please enter valid times. The trip end must be after the start.';
      return;
    }

    const vehicle = this.selectedVehicle;
    const driver = this.drivers.find(
      item => item.id === this.form.driverId
    );

    if (!vehicle || vehicle.status !== 'AVAILABLE') {
      this.feedbackMessage =
        'The selected vehicle is no longer available.';
      return;
    }

    if (!driver || driver.status !== 'APPROVED') {
      this.feedbackMessage = 'Select an approved driver.';
      return;
    }

    if (
      this.form.shipmentIds.some(
        id => !this.eligibleShipments.some(shipment => shipment.id === id)
      )
    ) {
      this.feedbackMessage =
        'One or more shipments are no longer eligible for assignment. Refresh your selection.';
      return;
    }

    if (this.capacityWarning) {
      this.feedbackMessage = this.capacityWarning;
      return;
    }

    if (this.cargoCompatibilityWarning) {
      this.feedbackMessage = this.cargoCompatibilityWarning;
      return;
    }

    if (this.schedulingWarning) {
      this.feedbackMessage = this.schedulingWarning;
      return;
    }

    if (this.shipmentWindowWarning) {
      this.feedbackMessage = this.shipmentWindowWarning;
      return;
    }

    const shipmentReferences = this.selectedShipments.map(
      shipment => shipment.referenceNumber
    );

    this.tripService.createTrip({
      vehicleId: vehicle.id,
      driverId: driver.id,
      shipmentIds: [...this.form.shipmentIds],
      plannedStart: this.form.plannedStart,
      plannedEnd: this.form.plannedEnd,
      distanceKm: Math.max(
        0,
        Number(this.form.distanceKm) || 0
      ),
      notes: this.form.notes.trim() ||
        `Draft created for ${shipmentReferences.length} shipment(s).`
    }).subscribe({
      next: trip => {
        const saved = {
          ...trip,
          vehicleRegistration: vehicle.registrationNumber,
          driverName: driver.fullName,
          shipmentReferences
        };
        this.loadTrips();
        this.showCreateForm = false;
        this.selectedTrip = saved;
        this.feedbackMessage = '';
      },
      error: (error: HttpErrorResponse) => {
        const message = error.error?.message;
        this.feedbackMessage = typeof message === 'string' && message.trim()
          ? message
          : 'Unable to create trip. Please try again.';
      }
    });
  }

  private buildStops(): Trip['stops'] {
    const stops: Trip['stops'] = [];

    for (const shipment of this.selectedShipments) {
      stops.push({
        id: `${shipment.id}-PICKUP`,
        sequence: 0,
        type: 'PICKUP',
        location: shipment.pickupLocation,
        shipmentReference: shipment.referenceNumber,
        organizationName: shipment.organizationName,
        plannedArrival: shipment.pickupWindowStart,
        status: 'PENDING'
      });

      stops.push({
        id: `${shipment.id}-DELIVERY`,
        sequence: 0,
        type: 'DELIVERY',
        location: shipment.deliveryLocation,
        shipmentReference: shipment.referenceNumber,
        organizationName: shipment.organizationName,
        plannedArrival: shipment.deliveryWindowStart,
        status: 'PENDING'
      });
    }

    return stops
      .sort(
        (a, b) =>
          new Date(a.plannedArrival).getTime() -
          new Date(b.plannedArrival).getTime()
      )
      .map((stop, index) => ({
        ...stop,
        sequence: index + 1
      }));
  }

  reassignDriver(trip: Trip): void {
    if (!this.replacementDriverId) {
      this.feedbackMessage = 'Select the driver who should take this trip.';
      return;
    }
    this.tripService.assignDriver(trip.id, this.replacementDriverId).subscribe({
      next: updated => {
        const driver = this.eligibleDrivers.find(
          item => item.id === this.replacementDriverId
        );
        const saved = {
          ...updated,
          driverName: driver?.fullName || updated.driverName,
          driverId: this.replacementDriverId
        };
        this.trips = this.trips.map(item => item.id === trip.id ? { ...item, ...saved } : item);
        this.selectedTrip = { ...trip, ...saved };
        this.feedbackMessage =
          'Driver updated. If they were on another trip that had not started, they were moved here.';
        this.loadTrips();
      },
      error: (error: HttpErrorResponse) => {
        const message = error.error?.message;
        this.feedbackMessage = typeof message === 'string' && message.trim()
          ? message
          : 'Unable to change the driver.';
      }
    });
  }

  deleteTrip(trip: Trip): void {
    const confirmed = window.confirm(
      `Delete ${trip.referenceNumber}? It has not started. Its shipments go back to ready.`
    );
    if (!confirmed) {
      return;
    }
    this.tripService.deleteTrip(trip.id).subscribe({
      next: () => {
        this.trips = this.trips.filter(item => item.id !== trip.id);
        if (this.selectedTrip?.id === trip.id) {
          this.selectedTrip = null;
        }
        this.feedbackMessage = `${trip.referenceNumber} was deleted.`;
      },
      error: (error: HttpErrorResponse) => {
        const message = error.error?.message;
        this.feedbackMessage = typeof message === 'string' && message.trim()
          ? message
          : 'Unable to delete this trip.';
      }
    });
  }

  deleteUnstartedTrips(): void {
    const count = this.trips.filter(
      trip => trip.status === 'SCHEDULED' || trip.status === 'PLANNED'
    ).length;
    const confirmed = window.confirm(
      count
        ? `Delete ${count} trip${count === 1 ? '' : 's'} that ha${count === 1 ? 's' : 've'} not started? Their shipments go back to ready.`
        : 'Delete every trip that has not started? Their shipments go back to ready.'
    );
    if (!confirmed) {
      return;
    }
    this.tripService.deleteUnstartedTrips().subscribe({
      next: result => {
        this.selectedTrip = null;
        this.loadTrips();
        this.feedbackMessage = result.deleted === 1
          ? '1 trip that had not started was deleted.'
          : `${result.deleted} trips that had not started were deleted.`;
      },
      error: (error: HttpErrorResponse) => {
        const message = error.error?.message;
        this.feedbackMessage = typeof message === 'string' && message.trim()
          ? message
          : 'Unable to delete the trips that have not started.';
      }
    });
  }

  changeTripStatus(trip: Trip, status: TripStatus): void {
    if (!this.isAllowedStatusTransition(trip.status, status)) {
      this.feedbackMessage =
        `The status cannot change directly from ${this.getStatusLabel(trip.status)} to ${this.getStatusLabel(status)}.`;
      return;
    }

    if (status === 'DISPATCHED') {
      const vehicle = this.vehicles.find(
        item => item.id === trip.vehicleId
      );

      const driver = this.drivers.find(
        item => item.id === trip.driverId
      );

      if (!vehicle || vehicle.status !== 'AVAILABLE') {
        this.feedbackMessage =
          'The assigned vehicle must be available before dispatch.';
        return;
      }

      if (!driver || driver.status !== 'APPROVED') {
        this.feedbackMessage =
          'An approved driver must be assigned before dispatch.';
        return;
      }

      if (trip.shipmentReferences.length === 0) {
        this.feedbackMessage =
          'At least one shipment must be linked before dispatch.';
        return;
      }

      if (trip.stops.length === 0) {
        this.feedbackMessage =
          'Pickup and delivery stops must be generated before dispatch.';
        return;
      }
    }

    this.tripService.updateTripStatus(trip.id, status).subscribe({
      next: updated => {
        this.selectedTrip = this.selectedTrip?.id === updated.id
          ? updated
          : this.selectedTrip;
        this.loadTrips();
        this.feedbackMessage =
          `Trip status updated to ${this.getStatusLabel(status)}.`;
      },
      error: () => {
        this.feedbackMessage = 'Unable to update trip status.';
      }
    });
  }

  updateStopStatus(
    trip: Trip,
    stopId: string,
    status: StopStatus
  ): void {
    this.tripService.updateStopStatus(
      trip.id,
      stopId,
      status
    ).subscribe({
      next: updated => {
        this.selectedTrip = this.selectedTrip?.id === updated.id
          ? updated
          : this.selectedTrip;
        this.feedbackMessage = 'Stop status updated.';
        this.loadTrips();
      },
      error: () => {
        this.feedbackMessage = 'Could not update the stop status.';
      }
    });
  }

  getStatusLabel(status: TripStatus): string {
    const labels: Record<TripStatus, string> = {
      PLANNED: 'Planned',
      SCHEDULED: 'Scheduled',
      DISPATCHED: 'Dispatched',
      IN_TRANSIT: 'In transit',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled'
    };

    return labels[status];
  }

  getStopStatusLabel(status: StopStatus): string {
    const labels: Record<StopStatus, string> = {
      PENDING: 'Pending',
      ARRIVED: 'Arrived',
      COMPLETED: 'Completed',
      SKIPPED: 'Skipped'
    };

    return labels[status];
  }

  isAllowedStatusTransition(
    current: TripStatus,
    next: TripStatus
  ): boolean {
    const transitions: Record<TripStatus, TripStatus[]> = {
      PLANNED: ['SCHEDULED', 'CANCELLED'],
      SCHEDULED: ['PLANNED', 'DISPATCHED', 'CANCELLED'],
      DISPATCHED: ['IN_TRANSIT', 'CANCELLED'],
      IN_TRANSIT: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: []
    };

    return transitions[current].includes(next);
  }

  trackByTrip(_index: number, trip: Trip): string {
    return trip.id;
  }

  trackByStop(_index: number, stop: Trip['stops'][number]): string {
    return stop.id;
  }
}
