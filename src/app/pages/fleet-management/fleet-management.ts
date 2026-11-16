
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Driver } from '../../models/driver.model';
import { Organization, OrganizationService } from '../../services/organization';
import { DriverManagementService } from '../../services/driver-management.service';
import {
  CargoCategory,
  Vehicle,
  VehicleStatus,
  VehicleType
} from '../../models/vehicle.model';
import { FleetManagementService } from '../../services/fleet-management.service';

@Component({
  selector: 'app-fleet-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fleet-management.html',
  styleUrl: './fleet-management.css'
})
export class FleetManagement {
  private readonly fleetService = inject(FleetManagementService);
  private readonly driverService = inject(DriverManagementService);
  private readonly organizationService = inject(OrganizationService);

  vehicles: Vehicle[] = [];
  drivers: Driver[] = [];
  organizations: Organization[] = [];
  searchTerm = '';
  showForm = false;
  selectedVehicle: Vehicle | null = null;
  errorMessage = '';
  successMessage = '';

  readonly vehicleTypes: VehicleType[] = this.fleetService.getVehicleTypes();
  readonly cargoOptions: CargoCategory[] = this.fleetService.getCargoCategories();

  form = this.emptyForm();

  constructor() {
    this.refreshVehicles();
    this.loadOrganizations();
    this.loadDrivers();
  }

  private emptyForm() {
    return {
      registrationNumber: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      type: 'MEDIUM_TRUCK' as VehicleType,
      ownerOrganizationId: '',
      maxWeightKg: 5000,
      cargoVolumeM3: 20,
      cargoCategories: ['GENERAL'] as CargoCategory[],
      hasCompartments: false,
      refrigerated: false,
      assignedDriverId: '',
      status: 'AVAILABLE' as VehicleStatus,
      lastServiceDate: '',
      nextServiceDate: '',
      notes: ''
    };
  }

  refreshVehicles(): void {
    this.fleetService.getVehicles().subscribe({
      next: vehicles => {
        this.vehicles = vehicles;
      },
      error: () => {
        this.errorMessage = 'Unable to load vehicles. Please try again.';
      }
    });
  }

  private loadOrganizations(): void {
    this.organizationService.getBusinessOrganizations().subscribe({
      next: organizations => {
        this.organizations = organizations.filter(organization =>
          organization.type === 'MANUFACTURER' ||
          organization.type === 'DISTRIBUTOR'
        );
      },
      error: () => {
        this.errorMessage = 'Unable to load organizations. Please try again.';
      }
    });
  }

  private loadDrivers(): void {
    this.driverService.getDrivers().subscribe({
      next: drivers => {
        this.drivers = drivers;
      },
      error: () => {
        this.errorMessage = 'Unable to load drivers. Please try again.';
      }
    });
  }

  get filteredVehicles(): Vehicle[] {
    const query = this.searchTerm.trim().toLowerCase();

    return this.vehicles.filter(vehicle => {
      const matchesQuery =
        !query ||
        vehicle.registrationNumber.toLowerCase().includes(query) ||
        vehicle.make.toLowerCase().includes(query) ||
        vehicle.model.toLowerCase().includes(query) ||
        vehicle.ownerOrganizationName.toLowerCase().includes(query) ||
        (vehicle.assignedDriverName ?? '').toLowerCase().includes(query);

      return matchesQuery;
    });
  }

  get totalVehicles(): number {
    return this.vehicles.length;
  }

  get availableVehicles(): number {
    return this.vehicles.filter(v => v.status === 'AVAILABLE').length;
  }

  get assignedVehicles(): number {
    return this.vehicles.filter(v =>
      v.status === 'ASSIGNED' || v.status === 'IN_TRANSIT'
    ).length;
  }

  get maintenanceVehicles(): number {
    return this.vehicles.filter(v => v.status === 'MAINTENANCE').length;
  }

  get availableDrivers() {
    return this.drivers.filter(driver => driver.status === 'APPROVED');
  }

  openRegistration(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.selectedVehicle = null;
    this.form = this.emptyForm();
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
  }

  onOrganizationChange(): void {
    this.form.assignedDriverId = '';
  }

  toggleCargo(category: CargoCategory, checked: boolean): void {
    if (checked && !this.form.cargoCategories.includes(category)) {
      this.form.cargoCategories = [...this.form.cargoCategories, category];
    } else if (!checked) {
      this.form.cargoCategories = this.form.cargoCategories.filter(
        item => item !== category
      );
    }
  }

  registerVehicle(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.form.cargoCategories.length) {
      this.errorMessage = 'Select at least one supported cargo category.';
      return;
    }

    if (this.form.refrigerated &&
        !this.form.cargoCategories.includes('FOOD') &&
        !this.form.cargoCategories.includes('PERISHABLE')) {
      this.errorMessage =
        'Refrigerated vehicles must support food or perishable cargo.';
      return;
    }

    const organization = this.organizations.find(
      item => item.id === this.form.ownerOrganizationId
    );

    if (!organization) {
      this.errorMessage = 'Select a vehicle owner organization.';
      return;
    }

    const driver = this.availableDrivers.find(
      item => item.id === this.form.assignedDriverId
    );

    this.fleetService.registerVehicle({
        registrationNumber: this.form.registrationNumber,
        make: this.form.make.trim(),
        model: this.form.model.trim(),
        year: Number(this.form.year),
        type: this.form.type,
        ownerOrganizationId: organization.id,
        ownerOrganizationName: organization.name,
        maxWeightKg: Number(this.form.maxWeightKg),
        cargoVolumeM3: Number(this.form.cargoVolumeM3),
        cargoCategories: [...this.form.cargoCategories],
        hasCompartments: this.form.hasCompartments,
        refrigerated: this.form.refrigerated,
        assignedDriverId: driver?.id ?? null,
        assignedDriverName: driver?.fullName ?? null,
        status: this.form.assignedDriverId ? 'ASSIGNED' : this.form.status,
        lastServiceDate: this.form.lastServiceDate,
        nextServiceDate: this.form.nextServiceDate,
        notes: this.form.notes.trim()
      })
      .subscribe({
        next: () => {
          this.refreshVehicles();
          this.showForm = false;
          this.form = this.emptyForm();
          this.successMessage = 'Vehicle registered successfully.';
        },
        error: error => {
          this.errorMessage = this.getApiErrorMessage(
            error,
            'Unable to register vehicle.'
          );
        }
      });
  }

  viewVehicle(vehicle: Vehicle): void {
    this.selectedVehicle = vehicle;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeDetails(): void {
    this.selectedVehicle = null;
  }

  changeStatus(vehicle: Vehicle, status: VehicleStatus): void {
    this.fleetService.updateVehicleStatus(vehicle.id, status).subscribe({
      next: updated => {
        this.refreshVehicles();
        this.selectedVehicle = updated;
        this.successMessage = `${vehicle.registrationNumber} updated to ${this.statusLabel(status)}.`;
        this.errorMessage = '';
      },
      error: error => {
        this.errorMessage = this.getApiErrorMessage(
          error,
          'Unable to update this vehicle.'
        );
      }
    });
  }

  statusLabel(status: VehicleStatus): string {
    const labels: Record<VehicleStatus, string> = {
      AVAILABLE: 'Available',
      ASSIGNED: 'Assigned',
      IN_TRANSIT: 'In transit',
      MAINTENANCE: 'Maintenance',
      INACTIVE: 'Inactive'
    };

    return labels[status];
  }

  typeLabel(type: VehicleType): string {
    return type.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }

  cargoLabel(category: CargoCategory): string {
    return category.replace(/_/g, ' ').toLowerCase()
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

  trackByVehicleId(_index: number, vehicle: Vehicle): string {
    return vehicle.id;
  }
}
