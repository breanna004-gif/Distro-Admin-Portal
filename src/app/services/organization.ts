import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { ApiCollection, unwrapApiCollection } from './api-collection';

export type OrganizationType =
  | 'MANUFACTURER'
  | 'DISTRIBUTOR'
  | 'LOGISTICS'
  | 'RETAILER'
  | 'OTHER';

export type OrganizationStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'PENDING'
  | 'SUSPENDED';

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;

  // UI fields
  contactName?: string;
  email?: string;
  phone?: string;
  location?: string;

  status?: OrganizationStatus;

  userCount?: number;
  adminCount?: number;
  staffCount?: number;
  driverCount?: number;
  truckCount?: number;
  availableTruckCount?: number;
  productCount?: number;
  availableProductCount?: number;
  inventoryUnits?: number;
  inventoryCount?: number;

  createdAt?: string;
  updatedAt?: string;
}

type DirectoryOrganization = Omit<Organization, 'type' | 'name'> & {
  name?: string | null;
  organizationName?: string | null;
  companyName?: string | null;
  businessName?: string | null;
  legalName?: string | null;
  type?: OrganizationType;
};

export interface CreateOrganizationRequest {
  name: string;
  type: 'MANUFACTURER' | 'DISTRIBUTOR';
  contactName?: string;
  email?: string;
  phone?: string;
  location?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {

  private http = inject(HttpClient);

  private readonly apiUrl =
    '/api/organizations';

  private mapDirectoryOrganization(
    organization: DirectoryOrganization,
    type: 'MANUFACTURER' | 'DISTRIBUTOR'
  ): Organization {
    return {
      ...organization,
      name:
        organization.organizationName?.trim() ||
        organization.companyName?.trim() ||
        organization.businessName?.trim() ||
        organization.legalName?.trim() ||
        organization.name?.trim() ||
        '',
      type
    };
  }

  getManufacturers(): Observable<Organization[]> {
    return this.http
      .get<ApiCollection<DirectoryOrganization>>('/api/manufacturers')
      .pipe(
        map(response =>
          unwrapApiCollection(response).map(organization =>
            this.mapDirectoryOrganization(organization, 'MANUFACTURER')
          )
        )
      );
  }

  getManufacturer(id: string): Observable<Organization> {
    return this.http
      .get<DirectoryOrganization>(`/api/manufacturers/${encodeURIComponent(id)}`)
      .pipe(
        map(organization => ({
          ...this.mapDirectoryOrganization(organization, 'MANUFACTURER')
        }))
      );
  }

  getDistributors(): Observable<Organization[]> {
    return this.http
      .get<ApiCollection<DirectoryOrganization>>('/api/distributors')
      .pipe(
        map(response =>
          unwrapApiCollection(response).map(organization =>
            this.mapDirectoryOrganization(organization, 'DISTRIBUTOR')
          )
        )
      );
  }

  getBusinessOrganizations(): Observable<Organization[]> {
    return forkJoin({
      manufacturers: this.getManufacturers(),
      distributors: this.getDistributors()
    }).pipe(
      map(({ manufacturers, distributors }) => {
        const organizations = new Map<string, Organization>();
        [...manufacturers, ...distributors].forEach(organization => {
          organizations.set(organization.id, organization);
        });
        return [...organizations.values()];
      })
    );
  }

  getDistributor(id: string): Observable<Organization> {
    return this.http
      .get<DirectoryOrganization>(`/api/distributors/${encodeURIComponent(id)}`)
      .pipe(
        map(organization => ({
          ...this.mapDirectoryOrganization(organization, 'DISTRIBUTOR')
        }))
      );
  }

  getOrganizations(): Observable<Organization[]> {

    return this.http.get<Organization[]>(
      this.apiUrl
    );

  }


  getOrganization(
    id: string
  ): Observable<Organization> {

    return this.http.get<Organization>(
      `${this.apiUrl}/${id}`
    );

  }


  createOrganization(
    request: CreateOrganizationRequest
  ): Observable<Organization> {

    return this.http.post<Organization>(
      this.apiUrl,
      request
    );

  }

  updateOrganizationStatus(
    id: string,
    status: OrganizationStatus
  ): Observable<Organization> {
    return this.http.patch<Organization>(
      `${this.apiUrl}/${id}/status`,
      { status }
    );
  }

  deleteOrganization(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

}
