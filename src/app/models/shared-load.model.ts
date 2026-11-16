export type SharedLoadStatus =
  | 'RECOMMENDED'
  | 'AWAITING_CONFIRMATION'
  | 'CONFIRMED'
  | 'REJECTED';

export type OrganizationConfirmation =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED';

export interface SharedLoadShipment {
  id: string;
  referenceNumber: string;
  organizationName: string;
  cargoDescription: string;
  cargoCategory: string;
  weightKg: number;
  volumeM3: number;
  pickupLocation: string;
  deliveryLocation: string;
  pickupDate: string;
  sharedLoadAllowed: boolean;
}

export interface SharedLoadRecommendation {
  id: string;
  referenceNumber: string;
  shipments: SharedLoadShipment[];
  suggestedVehicleRegistration: string;
  vehicleCapacityKg: number;
  vehicleCapacityM3: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  weightUtilization: number;
  volumeUtilization: number;
  routeSummary: string;
  compatibilityNotes: string[];
  requiresCargoReview: boolean;
  status: SharedLoadStatus;
  confirmations: {
    [organizationName: string]: OrganizationConfirmation;
  };
  createdAt: string;
}