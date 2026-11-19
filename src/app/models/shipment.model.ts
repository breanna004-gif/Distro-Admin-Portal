
export type ShipmentStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'READY'
  | 'ASSIGNED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export type ShipmentCargoCategory =
  | 'GENERAL'
  | 'FOOD'
  | 'PERISHABLE'
  | 'FRAGILE'
  | 'HAZARDOUS'
  | 'CONSTRUCTION'
  | 'LIQUID'
  | 'OTHER';

export type HandlingRequirement =
  | 'STANDARD'
  | 'FRAGILE'
  | 'REFRIGERATED'
  | 'KEEP_DRY'
  | 'HAZARDOUS_HANDLING'
  | 'TEMPERATURE_CONTROLLED';

export interface Shipment {
  id: string;
  referenceNumber: string;

  organizationId: string;
  organizationName: string;
  organizationType: 'MANUFACTURER' | 'DISTRIBUTOR';

  cargoDescription: string;
  cargoCategory: ShipmentCargoCategory;
  weightKg: number;
  volumeM3: number;
  handlingRequirements: HandlingRequirement[];

  pickupLocation: string;
  pickupLatitude: number | null;
  pickupLongitude: number | null;
  pickupWindowStart: string;
  pickupWindowEnd: string;

  deliveryLocation: string;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  deliveryWindowStart: string;
  deliveryWindowEnd: string;

  status: ShipmentStatus;
  sharedLoadAllowed: boolean;
  specialInstructions: string;

  assignedVehicleId: string | null;
  assignedVehicleRegistration: string | null;
  tripId: string | null;

  createdAt: string;
}
