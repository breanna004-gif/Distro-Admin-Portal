
export type VehicleStatus =
  | 'AVAILABLE'
  | 'ASSIGNED'
  | 'IN_TRANSIT'
  | 'MAINTENANCE'
  | 'INACTIVE';

export type VehicleType =
  | 'VAN'
  | 'LIGHT_TRUCK'
  | 'MEDIUM_TRUCK'
  | 'HEAVY_TRUCK'
  | 'REFRIGERATED_TRUCK'
  | 'TANKER'
  | 'FLATBED'
  | 'OTHER';

export type CargoCategory =
  | 'GENERAL'
  | 'FOOD'
  | 'PERISHABLE'
  | 'FRAGILE'
  | 'HAZARDOUS'
  | 'CONSTRUCTION'
  | 'LIQUID'
  | 'OTHER';

export interface Vehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  type: VehicleType;
  ownerOrganizationId: string;
  ownerOrganizationName: string;
  maxWeightKg: number;
  cargoVolumeM3: number;
  cargoCategories: CargoCategory[];
  hasCompartments: boolean;
  refrigerated: boolean;
  assignedDriverId: string | null;
  assignedDriverName: string | null;
  status: VehicleStatus;
  lastServiceDate: string;
  nextServiceDate: string;
  notes: string;
  createdAt: string;
}
