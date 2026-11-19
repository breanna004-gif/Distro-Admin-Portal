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

interface BackendShipment extends Partial<Shipment> {
  shipmentNumber?: string | null;
  allowSharedLoads?: boolean | null;
}

@Injectable({
  providedIn: 'root'
})
export class ShipmentManagementService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/shipments';

  getShipments(): Observable<Shipment[]> {
    return this.http
      .get<ApiCollection<BackendShipment>>(this.apiUrl)
      .pipe(
        map(response =>
          unwrapApiCollection(response).map(item =>
            this.normalizeShipment(this.mapShipment(item))
          )
        )
      );
  }

  getShipmentById(id: string): Observable<Shipment> {
    return this.http
      .get<BackendShipment>(`${this.apiUrl}/${id}`)
      .pipe(map(item => this.normalizeShipment(this.mapShipment(item))));
  }

  registerShipment(
    details: Omit<Shipment, 'id' | 'referenceNumber' | 'createdAt'>
  ): Observable<Shipment> {
    return this.http
      .post<BackendShipment>(this.apiUrl, details)
      .pipe(map(item => this.normalizeShipment(this.mapShipment(item))));
  }

  updateShipmentStatus(
    id: string,
    status: ShipmentStatus
  ): Observable<Shipment> {
    return this.http
      .patch<BackendShipment>(`${this.apiUrl}/${id}/status`, { status })
      .pipe(map(item => this.normalizeShipment(this.mapShipment(item))));
  }

  private mapShipment(item: BackendShipment): Shipment {
    return {
      ...(item as Shipment),
      referenceNumber: item.referenceNumber || item.shipmentNumber || '',
      sharedLoadAllowed: item.sharedLoadAllowed ?? item.allowSharedLoads ?? false,
      handlingRequirements: item.handlingRequirements ?? [],
      organizationName: item.organizationName ?? ''
    };
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
      'ASSIGNED',
      'IN_TRANSIT',
      'DELIVERED',
      'FAILED',
      'CANCELLED'
    ];

    return {
      ...shipment,
      status: validStatuses.includes(normalizedStatus as ShipmentStatus)
        ? (normalizedStatus as ShipmentStatus)
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
