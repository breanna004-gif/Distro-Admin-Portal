import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiCollection, unwrapApiCollection } from './api-collection';
import {
  OrganizationConfirmation,
  SharedLoadRecommendation
} from '../models/shared-load.model';

@Injectable({
  providedIn: 'root'
})
export class SharedLoadsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/shared-loads';

  getRecommendations(): Observable<SharedLoadRecommendation[]> {
    return this.http
      .get<ApiCollection<SharedLoadRecommendation>>(this.apiUrl)
      .pipe(map(unwrapApiCollection));
  }

  getRecommendationById(id: string): Observable<SharedLoadRecommendation> {
    return this.http.get<SharedLoadRecommendation>(`${this.apiUrl}/${id}`);
  }

  updateConfirmation(
    recommendationId: string,
    organizationName: string,
    decision: OrganizationConfirmation
  ): Observable<SharedLoadRecommendation> {
    return this.http.patch<SharedLoadRecommendation>(
      `${this.apiUrl}/${recommendationId}/confirmations`,
      { organizationName, decision }
    );
  }

  resetRecommendation(
    recommendationId: string
  ): Observable<SharedLoadRecommendation> {
    return this.http.post<SharedLoadRecommendation>(
      `${this.apiUrl}/${recommendationId}/reset`,
      {}
    );
  }
}
