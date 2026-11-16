import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiCollection, unwrapApiCollection } from './api-collection';
import {
  HandlingRequirement,
  Shipment,
  ShipmentCargoCategory,
  ShipmentStatus
} from '../models/shipment.model';

@Injectable({
  providedIn: 'root'
})
export class ShipmentManagementService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/shipments';

  getShipments(): Observable<Shipment[]> {
    return this.http
      .get<ApiCollection<Shipment>>(this.apiUrl)
      .pipe(map(unwrapApiCollection));
  }

  getShipmentById(id: string): Observable<Shipment> {
    return this.http.get<Shipment>(`${this.apiUrl}/${id}`);
  }

  registerShipment(
    details: Omit<Shipment, 'id' | 'referenceNumber' | 'createdAt'>
  ): Observable<Shipment> {
    return this.http.post<Shipment>(this.apiUrl, details);
  }

  updateShipmentStatus(
    id: string,
    status: ShipmentStatus
  ): Observable<Shipment> {
    return this.http.patch<Shipment>(`${this.apiUrl}/${id}/status`, { status });
  }

  getCargoCategories(): ShipmentCargoCategory[] {
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

  getHandlingRequirements(): HandlingRequirement[] {
    return [
      'STANDARD',
      'FRAGILE',
      'REFRIGERATED',
      'KEEP_DRY',
      'HAZARDOUS_HANDLING',
      'TEMPERATURE_CONTROLLED'
    ];
  }
}
