
export type DriverStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'INACTIVE';

export type CompanyAuthorizationStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'REJECTED'
  | 'REVOKED';

export type DriverOnboardingStatus =
  | 'INVITATION_PENDING'
  | 'INVITED'
  | 'PASSWORD_CHANGE_REQUIRED'
  | 'ACTIVATED'
  | 'EXPIRED'
  | 'REVOKED';

export type DeliveryStatus =
  | 'NOT_REQUESTED'
  | 'QUEUED'
  | 'SENT'
  | 'FAILED'
  | 'SIMULATED';

export interface DriverCompanyAuthorization {
  organizationId: string;
  organizationName: string;
  organizationType: 'MANUFACTURER' | 'DISTRIBUTOR';
  status: CompanyAuthorizationStatus;
  requestedAt: string;
}

export interface DriverOnboarding {
  status: DriverOnboardingStatus;
  smsDeliveryStatus: DeliveryStatus;
  emailDeliveryStatus: DeliveryStatus;
  invitedAt?: string;
  expiresAt?: string;
  lastResentAt?: string;
  passwordChangedAt?: string;
}

export interface Driver {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  licenceNumber: string;
  licenceExpiry: string;
  nationalId: string;
  status: DriverStatus;
  createdAt: string;
  notes: string;
  authorizations: DriverCompanyAuthorization[];
  onboarding: DriverOnboarding;
}
