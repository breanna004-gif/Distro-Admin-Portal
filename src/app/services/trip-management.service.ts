import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiCollection, unwrapApiCollection } from './api-collection';
import { Trip, TripStatus, StopStatus, TripStop } from '../models/trip.model';

interface BackendTripStop {
  id?: string;
  sequence?: number;
  status?: string;
  location?: {
    name?: string | null;
    address?: string | null;
  } | null;
}

interface BackendTrip {
  id: string;
  tripNumber?: string | null;
  referenceNumber?: string | null;
  status?: string | null;
  riderId?: string | null;
  driverId?: string | null;
  driverName?: string | null;
  vehicleId?: string | null;
  vehicleRegistration?: string | null;
  shipmentReferences?: string[] | null;
  stops?: BackendTripStop[] | null;
  scheduledStartLabel?: string | null;
  plannedStart?: string | null;
  plannedEnd?: string | null;
  totalDistanceKm?: number | null;
  distanceKm?: number | null;
  notes?: string | null;
  createdAt?: string | null;
}

export interface FreightTripRequest {
  vehicleId: string;
  driverId: string;
  shipmentIds: string[];
  plannedStart: string;
  plannedEnd: string;
  distanceKm: number;
  notes: string;
}

@Injectable({
  providedIn: 'root'
})
export class TripManagementService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/trips';

  getTrips(): Observable<Trip[]> {
    return this.http
      .get<ApiCollection<BackendTrip>>(this.apiUrl)
      .pipe(map(response => unwrapApiCollection(response).map(trip => this.mapTrip(trip))));
  }

  getTripById(id: string): Observable<Trip> {
    return this.http
      .get<BackendTrip>(`${this.apiUrl}/${id}`)
      .pipe(map(trip => this.mapTrip(trip)));
  }

  createTrip(input: FreightTripRequest): Observable<Trip> {
    return this.http
      .post<BackendTrip>(this.apiUrl, input)
      .pipe(map(trip => this.mapTrip(trip, input)));
  }

  updateTripStatus(id: string, status: TripStatus): Observable<Trip> {
    return this.http.patch<Trip>(`${this.apiUrl}/${id}/status`, { status });
  }

  assignDriver(id: string, driverId: string): Observable<Trip> {
    return this.http
      .patch<BackendTrip>(`${this.apiUrl}/${id}/assign`, { riderId: driverId })
      .pipe(map(trip => this.mapTrip(trip)));
  }

  updateStopStatus(
    tripId: string,
    stopId: string,
    status: StopStatus
  ): Observable<Trip> {
    return this.http.patch<Trip>(
      `${this.apiUrl}/${tripId}/stops/${stopId}/status`,
      { status }
    );
  }

  private mapTrip(trip: BackendTrip, input?: FreightTripRequest): Trip {
    const rawStatus = trip.status?.toUpperCase();
    const status: TripStatus =
      rawStatus === 'ONGOING' || rawStatus === 'DELAYED' || rawStatus === 'IN_TRANSIT'
        ? 'IN_TRANSIT'
        : rawStatus === 'COMPLETED'
          ? 'COMPLETED'
          : rawStatus === 'CANCELLED'
            ? 'CANCELLED'
            : rawStatus === 'DISPATCHED'
              ? 'DISPATCHED'
              : rawStatus === 'PLANNED'
                ? 'PLANNED'
                : 'SCHEDULED';

    const stops: TripStop[] = (trip.stops ?? []).map(stop => ({
      id: stop.id ?? '',
      sequence: stop.sequence ?? 0,
      type: 'DELIVERY',
      location: stop.location?.address || stop.location?.name || '',
      shipmentReference: '',
      organizationName: '',
      plannedArrival: '',
      status: (stop.status === 'COMPLETED' || stop.status === 'SKIPPED' || stop.status === 'ARRIVED'
        ? stop.status
        : 'PENDING') as StopStatus
    }));

    return {
      id: trip.id,
      referenceNumber: trip.tripNumber || trip.referenceNumber || trip.id,
      status,
      vehicleId: trip.vehicleId || input?.vehicleId || '',
      vehicleRegistration: trip.vehicleRegistration || '',
      driverId: trip.riderId || trip.driverId || input?.driverId || '',
      driverName: trip.driverName || '',
      shipmentReferences: trip.shipmentReferences ?? [],
      stops,
      plannedStart: trip.plannedStart || trip.scheduledStartLabel || input?.plannedStart || '',
      plannedEnd: trip.plannedEnd || input?.plannedEnd || '',
      distanceKm: trip.totalDistanceKm ?? trip.distanceKm ?? input?.distanceKm ?? 0,
      notes: trip.notes || input?.notes || '',
      createdAt: trip.createdAt || ''
    };
  }
}
