import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  OrganizationConfirmation,
  SharedLoadRecommendation,
  SharedLoadStatus
} from '../../models/shared-load.model';
import { SharedLoadsService } from '../../services/shared-loads.service';

@Component({
  selector: 'app-shared-loads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shared-loads.html',
  styleUrl: './shared-loads.css'
})
export class SharedLoads implements OnInit {
  recommendations: SharedLoadRecommendation[] = [];
  searchTerm = '';
  selectedRecommendation: SharedLoadRecommendation | null = null;
  feedbackMessage = '';

  constructor(private sharedLoadsService: SharedLoadsService) {}

  ngOnInit(): void {
    this.loadRecommendations();
  }

  loadRecommendations(): void {
    this.sharedLoadsService.getRecommendations().subscribe({
      next: recommendations => {
        this.recommendations = recommendations;
        if (this.selectedRecommendation) {
          this.selectedRecommendation =
            recommendations.find(
              item => item.id === this.selectedRecommendation?.id
            ) ?? null;
        }
      },
      error: () => {
        this.feedbackMessage =
          'Unable to load shared-load recommendations. Please try again.';
      }
    });
  }

  get filteredRecommendations(): SharedLoadRecommendation[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.recommendations.filter(recommendation => {
      const matchesSearch =
        !term ||
        recommendation.referenceNumber.toLowerCase().includes(term) ||
        recommendation.shipments.some(
          shipment =>
            shipment.referenceNumber.toLowerCase().includes(term) ||
            shipment.organizationName.toLowerCase().includes(term) ||
            shipment.cargoDescription.toLowerCase().includes(term)
        ) ||
        recommendation.suggestedVehicleRegistration
          .toLowerCase()
          .includes(term);

      return matchesSearch;
    });
  }

  get totalRecommendations(): number {
    return this.recommendations.length;
  }

  get awaitingConfirmationCount(): number {
    return this.recommendations.filter(
      item => item.status === 'AWAITING_CONFIRMATION'
    ).length;
  }

  get confirmedCount(): number {
    return this.recommendations.filter(
      item => item.status === 'CONFIRMED'
    ).length;
  }

  get reviewRequiredCount(): number {
    return this.recommendations.filter(
      item => item.requiresCargoReview &&
        item.status !== 'REJECTED'
    ).length;
  }

  openDetails(recommendation: SharedLoadRecommendation): void {
    this.selectedRecommendation = recommendation;
    this.feedbackMessage = '';
  }

  closeDetails(): void {
    this.selectedRecommendation = null;
    this.feedbackMessage = '';
  }

  updateConfirmation(
    recommendation: SharedLoadRecommendation,
    organizationName: string,
    decision: OrganizationConfirmation
  ): void {
    if (
      recommendation.requiresCargoReview &&
      decision === 'ACCEPTED'
    ) {
      this.feedbackMessage =
        'Cargo compatibility review is still required. Resolve the review before confirming this shared load.';
      return;
    }

    this.sharedLoadsService.updateConfirmation(
      recommendation.id,
      organizationName,
      decision
    ).subscribe({
      next: () => {
        this.feedbackMessage =
          `${organizationName}: confirmation updated to ${decision.toLowerCase()}.`;
        this.loadRecommendations();
      },
      error: () => {
        this.feedbackMessage = 'The confirmation could not be updated.';
      }
    });
  }

  resetConfirmations(recommendation: SharedLoadRecommendation): void {
    this.sharedLoadsService.resetRecommendation(recommendation.id).subscribe({
      next: () => {
        this.feedbackMessage = 'Organization confirmations have been reset.';
        this.loadRecommendations();
      },
      error: () => {
        this.feedbackMessage = 'Unable to reset confirmations.';
      }
    });
  }

  getStatusLabel(status: SharedLoadStatus): string {
    const labels: Record<SharedLoadStatus, string> = {
      RECOMMENDED: 'Recommended',
      AWAITING_CONFIRMATION: 'Awaiting confirmation',
      CONFIRMED: 'Confirmed',
      REJECTED: 'Rejected'
    };

    return labels[status];
  }

  getConfirmationLabel(
    confirmation: OrganizationConfirmation
  ): string {
    const labels: Record<OrganizationConfirmation, string> = {
      PENDING: 'Pending',
      ACCEPTED: 'Accepted',
      REJECTED: 'Rejected'
    };

    return labels[confirmation];
  }

  getOrganizationNames(
    recommendation: SharedLoadRecommendation
  ): string[] {
    return Object.keys(recommendation.confirmations);
  }

  trackByRecommendation(
    _index: number,
    recommendation: SharedLoadRecommendation
  ): string {
    return recommendation.id;
  }

  trackByShipment(
    _index: number,
    shipment: SharedLoadRecommendation['shipments'][number]
  ): string {
    return shipment.id;
  }
}