export type TripStatus =
  | 'PLANNED'
  | 'SCHEDULED'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'COMPLETED'
  | 'CANCELLED';

export type StopType = 'PICKUP' | 'DELIVERY';

export type StopStatus =
  | 'PENDING'
  | 'ARRIVED'
  | 'COMPLETED'
  | 'SKIPPED';

export interface TripStop {
  id: string;
  sequence: number;
  type: StopType;
  location: string;
  shipmentReference: string;
  organizationName: string;
  plannedArrival: string;
  status: StopStatus;
}

export interface Trip {
  id: string;
  referenceNumber: string;
  status: TripStatus;
  vehicleId: string;
  vehicleRegistration: string;
  driverId: string;
  driverName: string;
  shipmentReferences: string[];
  stops: TripStop[];
  plannedStart: string;
  plannedEnd: string;
  distanceKm: number;
  notes: string;
  createdAt: string;
}