
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Organization, OrganizationService } from '../../services/organization';
import {
  HandlingRequirement,
  Shipment,
  ShipmentCargoCategory,
  ShipmentStatus
} from '../../models/shipment.model';
import { ShipmentManagementService } from '../../services/shipment-management.service';

type ShipmentOrganization = Organization & {
  type: 'MANUFACTURER' | 'DISTRIBUTOR';
};

@Component({
  selector: 'app-shipments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shipments.html',
  styleUrl: './shipments.css'
})
export class Shipments {
  private readonly shipmentService = inject(ShipmentManagementService);
  private readonly organizationService = inject(OrganizationService);

  shipments: Shipment[] = [];
  searchTerm = '';
  showForm = false;
  selectedShipment: Shipment | null = null;
  errorMessage = '';
  successMessage = '';

  readonly cargoOptions = this.shipmentService.getCargoCategories();
  readonly handlingOptions = this.shipmentService.getHandlingRequirements();

  organizations: ShipmentOrganization[] = [];

  form = this.emptyForm();

  constructor() {
    this.refreshShipments();
    this.loadOrganizations();
  }

  private emptyForm() {
    return {
      organizationId: '',
      cargoDescription: '',
      cargoCategory: 'GENERAL' as ShipmentCargoCategory,
      weightKg: 1000,
      volumeM3: 5,
      handlingRequirements: ['STANDARD'] as HandlingRequirement[],
      pickupLocation: '',
      pickupLatitude: null as number | null,
      pickupLongitude: null as number | null,
      pickupWindowStart: '',
      pickupWindowEnd: '',
      deliveryLocation: '',
      deliveryLatitude: null as number | null,
      deliveryLongitude: null as number | null,
      deliveryWindowStart: '',
      deliveryWindowEnd: '',
      status: 'PENDING' as ShipmentStatus,
      sharedLoadAllowed: true,
      specialInstructions: ''
    };
  }

  refreshShipments(): void {
    this.shipmentService.getShipments().subscribe({
      next: shipments => {
        this.shipments = shipments;
      },
      error: () => {
        this.errorMessage = 'Unable to load shipments. Please try again.';
      }
    });
  }

  private loadOrganizations(): void {
    this.organizationService.getBusinessOrganizations().subscribe({
      next: organizations => {
        this.organizations = organizations.filter(
          (organization): organization is ShipmentOrganization =>
            organization.type === 'MANUFACTURER' ||
            organization.type === 'DISTRIBUTOR'
        );
      },
      error: () => {
        this.errorMessage = 'Unable to load organizations. Please try again.';
      }
    });
  }

  get filteredShipments(): Shipment[] {
    const query = this.searchTerm.trim().toLowerCase();

    return this.shipments.filter(shipment => {
      const matchesSearch =
        !query ||
        shipment.referenceNumber.toLowerCase().includes(query) ||
        shipment.organizationName.toLowerCase().includes(query) ||
        shipment.cargoDescription.toLowerCase().includes(query) ||
        shipment.pickupLocation.toLowerCase().includes(query) ||
        shipment.deliveryLocation.toLowerCase().includes(query);

      return matchesSearch;
    });
  }

  get totalShipments(): number {
    return this.shipments.length;
  }

  get awaitingDispatch(): number {
    return this.shipments.filter(s =>
      s.status === 'PENDING' || s.status === 'READY' || s.status === 'ASSIGNED'
    ).length;
  }

  get inTransit(): number {
    return this.shipments.filter(s => s.status === 'IN_TRANSIT').length;
  }

  get delivered(): number {
    return this.shipments.filter(s => s.status === 'DELIVERED').length;
  }

  openRegistration(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.selectedShipment = null;
    this.form = this.emptyForm();
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
  }

  toggleHandling(requirement: HandlingRequirement, checked: boolean): void {
    if (checked && !this.form.handlingRequirements.includes(requirement)) {
      this.form.handlingRequirements = [
        ...this.form.handlingRequirements,
        requirement
      ];
    } else if (!checked) {
      this.form.handlingRequirements = this.form.handlingRequirements.filter(
        item => item !== requirement
      );
    }
  }

  registerShipment(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const organization = this.organizations.find(
      item => item.id === this.form.organizationId
    );

    if (!organization) {
      this.errorMessage = 'Select the organization requesting this shipment.';
      return;
    }

    if (this.form.handlingRequirements.length === 0) {
      this.errorMessage = 'Select at least one cargo handling requirement.';
      return;
    }

    if (new Date(this.form.pickupWindowEnd) < new Date(this.form.pickupWindowStart)) {
      this.errorMessage = 'Pickup window end must be after its start.';
      return;
    }

    if (new Date(this.form.deliveryWindowEnd) < new Date(this.form.deliveryWindowStart)) {
      this.errorMessage = 'Delivery window end must be after its start.';
      return;
    }

    if (!this.hasMapPin(this.form.pickupLatitude, this.form.pickupLongitude)) {
      this.errorMessage = 'Enter the pickup pin from the map. 0, 0 is not a place.';
      return;
    }

    if (!this.hasMapPin(this.form.deliveryLatitude, this.form.deliveryLongitude)) {
      this.errorMessage = 'Enter the drop-off pin from the map. 0, 0 is not a place.';
      return;
    }

    this.shipmentService.registerShipment({
        organizationId: organization.id,
        organizationName: organization.name,
        organizationType: organization.type,
        cargoDescription: this.form.cargoDescription.trim(),
        cargoCategory: this.form.cargoCategory,
        weightKg: Number(this.form.weightKg),
        volumeM3: Number(this.form.volumeM3),
        handlingRequirements: [...this.form.handlingRequirements],
        pickupLocation: this.form.pickupLocation.trim(),
        pickupLatitude: Number(this.form.pickupLatitude),
        pickupLongitude: Number(this.form.pickupLongitude),
        pickupWindowStart: this.form.pickupWindowStart,
        pickupWindowEnd: this.form.pickupWindowEnd,
        deliveryLocation: this.form.deliveryLocation.trim(),
        deliveryLatitude: Number(this.form.deliveryLatitude),
        deliveryLongitude: Number(this.form.deliveryLongitude),
        deliveryWindowStart: this.form.deliveryWindowStart,
        deliveryWindowEnd: this.form.deliveryWindowEnd,
        status: this.form.status,
        sharedLoadAllowed: this.form.sharedLoadAllowed,
        specialInstructions: this.form.specialInstructions.trim(),
        assignedVehicleId: null,
        assignedVehicleRegistration: null,
        tripId: null
      })
      .subscribe({
        next: () => {
          this.refreshShipments();
          this.showForm = false;
          this.form = this.emptyForm();
          this.successMessage = 'Shipment registered successfully.';
        },
        error: error => {
          this.errorMessage = this.getApiErrorMessage(
            error,
            'Unable to register this shipment.'
          );
        }
      });
  }

  viewShipment(shipment: Shipment): void {
    this.selectedShipment = shipment;
    this.showForm = false;
    this.errorMessage = '';
  }

  closeDetails(): void {
    this.selectedShipment = null;
  }

  changeStatus(shipment: Shipment, status: ShipmentStatus): void {
    this.shipmentService.updateShipmentStatus(shipment.id, status).subscribe({
      next: updated => {
        this.refreshShipments();
        this.selectedShipment = updated;
        this.successMessage =
          `${shipment.referenceNumber} updated to ${this.statusLabel(status)}.`;
        this.errorMessage = '';
      },
      error: error => {
        this.errorMessage = this.getApiErrorMessage(
          error,
          'Unable to update this shipment.'
        );
      }
    });
  }

  deleteShipment(shipment: Shipment): void {
    const confirmed = window.confirm(
      `Delete ${shipment.referenceNumber}? This cannot be undone.`
    );
    if (!confirmed) {
      return;
    }
    this.shipmentService.deleteShipment(shipment.id).subscribe({
      next: () => {
        this.shipments = this.shipments.filter(item => item.id !== shipment.id);
        this.selectedShipment = null;
        this.successMessage = `${shipment.referenceNumber} was deleted.`;
        this.errorMessage = '';
      },
      error: error => {
        this.errorMessage = this.getApiErrorMessage(
          error,
          'Unable to delete this shipment.'
        );
      }
    });
  }

  statusLabel(status: ShipmentStatus): string {
    const labels: Record<ShipmentStatus, string> = {
      DRAFT: 'Draft',
      PENDING: 'Pending',
      READY: 'Ready for a trip',
      ASSIGNED: 'Assigned to a trip',
      IN_TRANSIT: 'In transit',
      DELIVERED: 'Delivered',
      FAILED: 'Failed',
      CANCELLED: 'Cancelled'
    };

    return labels[status] ?? 'Pending';
  }

  cargoLabel(category: ShipmentCargoCategory): string {
    return category.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }

  handlingLabel(requirement: HandlingRequirement): string {
    return requirement.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private getApiErrorMessage(error: unknown, fallback: string): string {
    if (
      error instanceof HttpErrorResponse &&
      typeof error.error?.message === 'string'
    ) {
      return error.error.message;
    }

    return fallback;
  }

  private hasMapPin(latitude: number | null, longitude: number | null): boolean {
    if (latitude == null || longitude == null) {
      return false;
    }
    const lat = Number(latitude);
    const lng = Number(longitude);
    return Number.isFinite(lat) && Number.isFinite(lng)
      && lat >= -90 && lat <= 90
      && lng >= -180 && lng <= 180
      && !(lat === 0 && lng === 0);
  }

  trackByShipmentId(_index: number, shipment: Shipment): string {
    return shipment.id;
  }
}
