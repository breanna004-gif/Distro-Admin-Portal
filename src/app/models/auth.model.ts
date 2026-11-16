import { Organization } from './organization.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  organizationName?: string;
  organizationType?: Organization['type'];
}
