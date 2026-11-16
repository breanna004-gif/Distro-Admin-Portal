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

@Injectable({
  providedIn: 'root'
})
export class FleetManagementService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/vehicles';

  getVehicles(): Observable<Vehicle[]> {
    return this.http
      .get<ApiCollection<Vehicle>>(this.apiUrl)
      .pipe(map(unwrapApiCollection));
  }

  getVehicleById(id: string): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.apiUrl}/${id}`);
  }

  registerVehicle(details: Omit<Vehicle, 'id' | 'createdAt'>): Observable<Vehicle> {
    return this.http.post<Vehicle>(this.apiUrl, details);
  }

  updateVehicleStatus(
    id: string,
    status: VehicleStatus
  ): Observable<Vehicle> {
    return this.http.patch<Vehicle>(`${this.apiUrl}/${id}/status`, { status });
  }

  assignDriver(
    vehicleId: string,
    driverId: string | null
  ): Observable<Vehicle> {
    return this.http.patch<Vehicle>(
      `${this.apiUrl}/${vehicleId}/driver`,
      { driverId }
    );
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
