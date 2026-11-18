import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiCollection, unwrapApiCollection } from './api-collection';
import {
  OrganizationConfirmation,
  SharedLoadRecommendation,
  SharedLoadStatus
} from '../models/shared-load.model';

interface BackendConfirmation {
  organizationName?: string | null;
  decision?: string | null;
}

interface BackendSharedLoad {
  id: string;
  proposerOrganizationName?: string | null;
  candidateOrganizationName?: string | null;
  status?: string | null;
  proposalNote?: string | null;
  reviewNote?: string | null;
  createdAt?: string | null;
  confirmations?: BackendConfirmation[] | null;
  referenceNumber?: string;
  shipments?: SharedLoadRecommendation['shipments'];
  suggestedVehicleRegistration?: string;
  routeSummary?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SharedLoadsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/shared-loads';

  getRecommendations(): Observable<SharedLoadRecommendation[]> {
    return this.http
      .get<ApiCollection<BackendSharedLoad>>(this.apiUrl)
      .pipe(
        map(response =>
          unwrapApiCollection(response).map(item => this.mapRecommendation(item))
        )
      );
  }

  getRecommendationById(id: string): Observable<SharedLoadRecommendation> {
    return this.http
      .get<BackendSharedLoad>(`${this.apiUrl}/${id}`)
      .pipe(map(item => this.mapRecommendation(item)));
  }

  updateConfirmation(
    recommendationId: string,
    organizationName: string,
    decision: OrganizationConfirmation
  ): Observable<SharedLoadRecommendation> {
    return this.http
      .post<BackendSharedLoad>(
        `${this.apiUrl}/${recommendationId}/confirmations`,
        { organizationName, decision }
      )
      .pipe(map(item => this.mapRecommendation(item)));
  }

  reviewRecommendation(
    recommendationId: string,
    compatible: boolean
  ): Observable<SharedLoadRecommendation> {
    return this.http
      .post<BackendSharedLoad>(`${this.apiUrl}/${recommendationId}/review`, {
        compatible
      })
      .pipe(map(item => this.mapRecommendation(item)));
  }

  resetRecommendation(
    recommendationId: string
  ): Observable<SharedLoadRecommendation> {
    return this.http
      .post<BackendSharedLoad>(`${this.apiUrl}/${recommendationId}/reset`, {})
      .pipe(map(item => this.mapRecommendation(item)));
  }

  private mapRecommendation(raw: BackendSharedLoad): SharedLoadRecommendation {
    if (raw.referenceNumber && raw.shipments && !Array.isArray(raw.confirmations)) {
      return raw as unknown as SharedLoadRecommendation;
    }

    const proposer = raw.proposerOrganizationName?.trim() || 'Proposing organization';
    const candidate = raw.candidateOrganizationName?.trim() || 'Candidate organization';
    const confirmations: SharedLoadRecommendation['confirmations'] = {
      [proposer]: 'PENDING',
      [candidate]: 'PENDING'
    };

    for (const row of raw.confirmations ?? []) {
      const name = row.organizationName?.trim();
      if (!name) {
        continue;
      }
      confirmations[name] = this.mapDecision(row.decision);
    }

    const status = this.mapStatus(raw.status);
    const notes = [raw.proposalNote, raw.reviewNote].filter(
      (note): note is string => !!note && note.trim().length > 0
    );

    return {
      id: raw.id,
      referenceNumber: raw.id.slice(0, 8).toUpperCase(),
      shipments: [],
      suggestedVehicleRegistration: '—',
      vehicleCapacityKg: 0,
      vehicleCapacityM3: 0,
      totalWeightKg: 0,
      totalVolumeM3: 0,
      weightUtilization: 0,
      volumeUtilization: 0,
      routeSummary: notes[0] ?? 'Shared load recommendation',
      compatibilityNotes: notes.length > 0 ? notes : ['No compatibility notes recorded.'],
      requiresCargoReview: status === 'RECOMMENDED',
      status,
      confirmations,
      createdAt: raw.createdAt ?? ''
    };
  }

  private mapStatus(status?: string | null): SharedLoadStatus {
    switch (status) {
      case 'AWAITING_CONFIRMATION':
      case 'CONFIRMED':
      case 'REJECTED':
      case 'RECOMMENDED':
        return status;
      case 'CANCELLED':
        return 'REJECTED';
      default:
        return 'RECOMMENDED';
    }
  }

  private mapDecision(decision?: string | null): OrganizationConfirmation {
    switch (decision) {
      case 'CONFIRMED':
      case 'ACCEPTED':
        return 'ACCEPTED';
      case 'DECLINED':
      case 'REJECTED':
        return 'REJECTED';
      default:
        return 'PENDING';
    }
  }
}
