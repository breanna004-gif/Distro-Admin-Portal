export type UserRole =
  | 'MANUFACTURER_ADMIN'
  | 'MANUFACTURER_STAFF'
  | 'DISTRIBUTOR_ADMIN'
  | 'DISTRIBUTOR_STAFF'
  | 'DRIVER'
  | 'CUSTOMER'
  | 'SUPER_ADMIN'
  | 'PLATFORM_ADMIN'
  | 'ORGANIZATION_ADMIN'
  | 'MANUFACTURER'
  | 'DISTRIBUTOR';

export type UserStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'DEACTIVATED'
  | 'PENDING';

export type OrganizationType =
  | 'MANUFACTURER'
  | 'DISTRIBUTOR';

export interface User {
  id: string;

  name: string;

  email: string;

  phone?: string;

  role: UserRole;

  status: UserStatus;

  organizationId?: string;

  organizationName?: string;

  organizationType?: string;

  phoneVerified?: boolean;

  emailVerified?: boolean;

  invitationStatus?: string;

  otpDeliveryStatus?: string;

  activationLinkDeliveryStatus?: string;

  invitationSentAt?: string;

  lastActive?: string;

  createdAt?: string;
}
