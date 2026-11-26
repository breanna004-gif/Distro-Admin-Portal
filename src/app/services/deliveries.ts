import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpParams
} from '@angular/common/http';
import { Observable, forkJoin, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from './auth';
import { Delivery } from '../models/delivery.model';
import { ApiCollection, unwrapApiCollection } from './api-collection';
import { DriverManagementService } from './driver-management.service';
import { FleetManagementService } from './fleet-management.service';

interface BackendTripStop {
  id?: string;
  sequence?: number;
  status?: string;
  orderNumber?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  etaLabel?: string | null;
  location?: {
    name?: string | null;
    address?: string | null;
  } | null;
}

interface BackendTrip {
  id: string;
  tripNumber?: string | null;
  status?: string | null;
  riderId?: string | null;
  driverId?: string | null;
  driverName?: string | null;
  vehicleId?: string | null;
  vehicleRegistration?: string | null;
  scheduledStartLabel?: string | null;
  stops?: BackendTripStop[] | null;
  origin?: {
    name?: string | null;
    address?: string | null;
  } | null;
}

@Injectable({
  providedIn: 'root'
})
export class DeliveriesService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private driverService = inject(DriverManagementService);
  private fleetService = inject(FleetManagementService);

  // The existing Spring Boot TripController serves delivery records here.
  private readonly apiUrl = '/api/v1/trips';

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();

    return new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json'
    });
  }

  getDeliveries(
    page: number = 0,
    size: number = 20,
    search: string = ''
  ): Observable<{
    content: Delivery[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  }> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return forkJoin({
      trips: this.http.get<ApiCollection<BackendTrip> | { content?: BackendTrip[]; totalElements?: number; totalPages?: number }>(
        this.apiUrl,
        { params, headers: this.getHeaders() }
      ),
      drivers: this.driverService.getDrivers().pipe(catchError(() => of([]))),
      vehicles: this.fleetService.getVehicles().pipe(catchError(() => of([])))
    }).pipe(
      map(({ trips, drivers, vehicles }) => {
        const driverNames = new Map(
          drivers.map(driver => [driver.id, driver.fullName] as const)
        );
        const vehicleRegs = new Map(
          vehicles.map(vehicle => [vehicle.id, vehicle.registrationNumber] as const)
        );

        const records = unwrapApiCollection(trips as ApiCollection<BackendTrip>);
        let content = records.map(trip =>
          this.mapTripToDelivery(trip, driverNames, vehicleRegs)
        );

        if (search.trim()) {
          const term = search.trim().toLowerCase();
          content = content.filter(delivery =>
            delivery.id.toLowerCase().includes(term) ||
            (delivery.orderId ?? '').toLowerCase().includes(term) ||
            (delivery.customerName ?? '').toLowerCase().includes(term) ||
            (delivery.driverName ?? '').toLowerCase().includes(term) ||
            (delivery.deliveryAddress ?? '').toLowerCase().includes(term) ||
            (delivery.vehicleNumber ?? '').toLowerCase().includes(term)
          );
        }

        const pageResponse = trips as { totalElements?: number; totalPages?: number };
        return {
          content,
          totalElements: pageResponse.totalElements ?? content.length,
          totalPages: pageResponse.totalPages ?? Math.max(1, Math.ceil(content.length / size)),
          size,
          number: page
        };
      })
    );
  }

  getDelivery(deliveryId: string): Observable<Delivery> {
    return forkJoin({
      trip: this.http.get<BackendTrip>(
        `${this.apiUrl}/${deliveryId}`,
        { headers: this.getHeaders() }
      ),
      drivers: this.driverService.getDrivers().pipe(catchError(() => of([]))),
      vehicles: this.fleetService.getVehicles().pipe(catchError(() => of([])))
    }).pipe(
      map(({ trip, drivers, vehicles }) => {
        const driverNames = new Map(
          drivers.map(driver => [driver.id, driver.fullName] as const)
        );
        const vehicleRegs = new Map(
          vehicles.map(vehicle => [vehicle.id, vehicle.registrationNumber] as const)
        );
        return this.mapTripToDelivery(trip, driverNames, vehicleRegs);
      })
    );
  }

  assignDriver(
    deliveryId: string,
    driverId: string
  ): Observable<Delivery> {
    return this.http.patch<BackendTrip>(
      `${this.apiUrl}/${deliveryId}/assign`,
      { riderId: driverId },
      { headers: this.getHeaders() }
    ).pipe(map(trip => this.mapTripToDelivery(trip, new Map(), new Map())));
  }

  updateDeliveryStatus(
    deliveryId: string,
    status: Delivery['status']
  ): Observable<Delivery> {
    return this.http.patch<BackendTrip>(
      `${this.apiUrl}/${deliveryId}/status`,
      { status },
      { headers: this.getHeaders() }
    ).pipe(map(trip => this.mapTripToDelivery(trip, new Map(), new Map())));
  }

  getDeliveryTracking(deliveryId: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/${deliveryId}/tracking`,
      { headers: this.getHeaders() }
    );
  }

  private mapTripToDelivery(
    trip: BackendTrip,
    driverNames: Map<string, string>,
    vehicleRegs: Map<string, string>
  ): Delivery {
    const stops = [...(trip.stops ?? [])].sort(
      (a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)
    );
    const destinationStop = stops.length ? stops[stops.length - 1] : undefined;
    const contactStop = stops.find(stop => stop.contactName || stop.contactPhone) ?? destinationStop;
    const orderStop = stops.find(stop => stop.orderNumber) ?? destinationStop;
    const driverId = trip.riderId || trip.driverId || undefined;
    const vehicleId = trip.vehicleId || undefined;

    return {
      id: trip.id,
      orderId: orderStop?.orderNumber || '',
      customerName: contactStop?.contactName || '',
      customerPhone: contactStop?.contactPhone || undefined,
      deliveryAddress:
        destinationStop?.location?.address ||
        destinationStop?.location?.name ||
        trip.origin?.address ||
        trip.origin?.name ||
        '',
      driverId,
      driverName:
        trip.driverName?.trim() ||
        (driverId ? driverNames.get(driverId) : undefined) ||
        undefined,
      vehicleNumber:
        trip.vehicleRegistration?.trim() ||
        (vehicleId ? vehicleRegs.get(vehicleId) : undefined) ||
        undefined,
      status: this.mapStatus(trip.status),
      estimatedDelivery: destinationStop?.etaLabel || trip.scheduledStartLabel || undefined
    };
  }

  private mapStatus(status?: string | null): Delivery['status'] {
    const raw = (status ?? '').toUpperCase();
    switch (raw) {
      case 'COMPLETED':
      case 'DELIVERED':
        return 'DELIVERED';
      case 'CANCELLED':
        return 'CANCELLED';
      case 'FAILED':
        return 'FAILED';
      case 'ONGOING':
      case 'IN_TRANSIT':
      case 'DELAYED':
      case 'DISPATCHED':
        return 'IN_TRANSIT';
      case 'ASSIGNED':
        return 'ASSIGNED';
      case 'PICKED_UP':
        return 'PICKED_UP';
      default:
        return 'PENDING';
    }
  }
}
