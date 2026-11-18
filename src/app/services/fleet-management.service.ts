import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiCollection, unwrapApiCollection } from './api-collection';
import {
  CargoCategory,
  Vehicle,
  VehicleStatus,
  VehicleType
} from '../models/vehicle.model';

interface BackendVehicle {
  id: string;
  organizationId?: string | null;
  ownerOrganizationId?: string | null;
  ownerOrganizationName?: string | null;
  registrationNumber?: string | null;
  vehicleType?: string | null;
  type?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  capacityKg?: number | null;
  maxWeightKg?: number | null;
  cargoVolumeM3?: number | null;
  cargoCategories?: CargoCategory[] | null;
  hasCompartments?: boolean | null;
  refrigerated?: boolean | null;
  driverId?: string | null;
  assignedDriverId?: string | null;
  assignedDriverName?: string | null;
  status?: string | null;
  lastServiceDate?: string | null;
  nextServiceDate?: string | null;
  notes?: string | null;
  createdAt?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class FleetManagementService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/vehicles';

  getVehicles(): Observable<Vehicle[]> {
    return this.http
      .get<ApiCollection<BackendVehicle>>(this.apiUrl)
      .pipe(map(response => unwrapApiCollection(response).map(vehicle => this.mapVehicle(vehicle))));
  }

  getVehicleById(id: string): Observable<Vehicle> {
    return this.http
      .get<BackendVehicle>(`${this.apiUrl}/${id}`)
      .pipe(map(vehicle => this.mapVehicle(vehicle)));
  }

  registerVehicle(details: Omit<Vehicle, 'id' | 'createdAt'>): Observable<Vehicle> {
    return this.http
      .post<BackendVehicle>(this.apiUrl, {
        registrationNumber: details.registrationNumber,
        vehicleType: details.type,
        make: details.make,
        model: details.model,
        capacityKg: details.maxWeightKg,
        organizationId: details.ownerOrganizationId
      })
      .pipe(map(vehicle => this.mapVehicle(vehicle)));
  }

  updateVehicleStatus(
    id: string,
    status: VehicleStatus
  ): Observable<Vehicle> {
    return this.http
      .patch<BackendVehicle>(`${this.apiUrl}/${id}/status`, {
        status: status === 'AVAILABLE' ? 'ACTIVE' : status
      })
      .pipe(map(vehicle => this.mapVehicle(vehicle)));
  }

  assignDriver(
    vehicleId: string,
    driverId: string | null
  ): Observable<Vehicle> {
    return this.http
      .patch<BackendVehicle>(
        `${this.apiUrl}/${vehicleId}/driver`,
        { driverId }
      )
      .pipe(map(vehicle => this.mapVehicle(vehicle)));
  }

  private mapVehicle(vehicle: BackendVehicle): Vehicle {
    const rawStatus = vehicle.status?.toUpperCase();
    const status: VehicleStatus =
      rawStatus === 'ACTIVE' || rawStatus === 'AVAILABLE'
        ? 'AVAILABLE'
        : rawStatus === 'MAINTENANCE'
          ? 'MAINTENANCE'
          : rawStatus === 'INACTIVE'
            ? 'INACTIVE'
            : rawStatus === 'ASSIGNED'
              ? 'ASSIGNED'
              : rawStatus === 'IN_TRANSIT'
                ? 'IN_TRANSIT'
                : 'AVAILABLE';

    return {
      id: vehicle.id,
      registrationNumber: vehicle.registrationNumber ?? '',
      make: vehicle.make ?? '',
      model: vehicle.model ?? '',
      year: vehicle.year ?? 0,
      type: (vehicle.vehicleType ?? vehicle.type ?? 'OTHER') as VehicleType,
      ownerOrganizationId: vehicle.organizationId ?? vehicle.ownerOrganizationId ?? '',
      ownerOrganizationName: vehicle.ownerOrganizationName ?? '',
      maxWeightKg: vehicle.capacityKg ?? vehicle.maxWeightKg ?? 0,
      cargoVolumeM3: vehicle.cargoVolumeM3 ?? 0,
      cargoCategories: vehicle.cargoCategories ?? [],
      hasCompartments: vehicle.hasCompartments ?? false,
      refrigerated: vehicle.refrigerated ?? false,
      assignedDriverId: vehicle.driverId ?? vehicle.assignedDriverId ?? null,
      assignedDriverName: vehicle.assignedDriverName ?? null,
      status,
      lastServiceDate: vehicle.lastServiceDate ?? '',
      nextServiceDate: vehicle.nextServiceDate ?? '',
      notes: vehicle.notes ?? '',
      createdAt: vehicle.createdAt ?? ''
    };
  }

  getVehicleTypes(): VehicleType[] {
    return [
      'VAN',
      'LIGHT_TRUCK',
      'MEDIUM_TRUCK',
      'HEAVY_TRUCK',
      'REFRIGERATED_TRUCK',
      'TANKER',
      'FLATBED',
      'OTHER'
    ];
  }

  getCargoCategories(): CargoCategory[] {
    return [
      'GENERAL',
      'FOOD',
      'PERISHABLE',
      'FRAGILE',
      'HAZARDOUS',
      'CONSTRUCTION',
      'LIQUID',
      'OTHER'
    ];
  }
}
