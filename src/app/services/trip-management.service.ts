import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiCollection, unwrapApiCollection } from './api-collection';
import { Trip, TripStatus, StopStatus } from '../models/trip.model';

@Injectable({
  providedIn: 'root'
})
export class TripManagementService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/trips';

  getTrips(): Observable<Trip[]> {
    return this.http
      .get<ApiCollection<Trip>>(this.apiUrl)
      .pipe(map(unwrapApiCollection));
  }

  getTripById(id: string): Observable<Trip> {
    return this.http.get<Trip>(`${this.apiUrl}/${id}`);
  }

  createTrip(input: Omit<Trip, 'id' | 'referenceNumber' | 'createdAt'>): Observable<Trip> {
    return this.http.post<Trip>(this.apiUrl, input);
  }

  updateTripStatus(id: string, status: TripStatus): Observable<Trip> {
    return this.http.patch<Trip>(`${this.apiUrl}/${id}/status`, { status });
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
}
