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
      .pipe(
        map(response => unwrapApiCollection(response).map(shipment =>
          this.normalizeShipment(shipment)
        ))
      );
  }

  getShipmentById(id: string): Observable<Shipment> {
    return this.http
      .get<Shipment>(`${this.apiUrl}/${id}`)
      .pipe(map(shipment => this.normalizeShipment(shipment)));
  }

  registerShipment(
    details: Omit<Shipment, 'id' | 'referenceNumber' | 'createdAt'>
  ): Observable<Shipment> {
    return this.http
      .post<Shipment>(this.apiUrl, details)
      .pipe(map(shipment => this.normalizeShipment(shipment)));
  }

  updateShipmentStatus(
    id: string,
    status: ShipmentStatus
  ): Observable<Shipment> {
    return this.http
      .patch<Shipment>(`${this.apiUrl}/${id}/status`, { status })
      .pipe(map(shipment => this.normalizeShipment(shipment)));
  }

  private normalizeShipment(shipment: Shipment): Shipment {
    const normalizedStatus =
      typeof shipment.status === 'string'
        ? shipment.status.trim().toUpperCase()
        : '';
    const validStatuses: ShipmentStatus[] = [
      'DRAFT',
      'PENDING',
      'READY',
      'MATCHED',
      'DISPATCHED',
      'IN_TRANSIT',
      'DELIVERED',
      'CANCELLED'
    ];

    return {
      ...shipment,
      status: validStatuses.includes(normalizedStatus as ShipmentStatus)
        ? normalizedStatus as ShipmentStatus
        : 'PENDING'
    };
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
