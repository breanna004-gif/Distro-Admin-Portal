import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { Organization, OrganizationService } from './organization';

describe('OrganizationService directory endpoints', () => {
  let service: OrganizationService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(OrganizationService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('gets manufacturers from the manufacturers endpoint', () => {
    let received: Organization[] | undefined;

    service.getManufacturers().subscribe(organizations => {
      received = organizations;
    });

    const request = httpTesting.expectOne('/api/manufacturers');
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 'm-1', name: 'Northwind Manufacturing' }]);

    expect(received).toEqual([{
      id: 'm-1',
      name: 'Northwind Manufacturing',
      type: 'MANUFACTURER'
    }]);
  });

  it('uses the registered organization name when the response name is a contact name', () => {
    let received: Organization[] | undefined;

    service.getManufacturers().subscribe(organizations => {
      received = organizations;
    });

    httpTesting.expectOne('/api/manufacturers').flush([{
      id: 'm-2',
      name: 'John Doe',
      organizationName: 'Simba Cement',
      email: 'john@example.com'
    }]);

    expect(received?.[0].name).toBe('Simba Cement');
  });

  it('gets distributors from the distributors endpoint and unwraps paged content', () => {
    let received: Organization[] | undefined;

    service.getDistributors().subscribe(organizations => {
      received = organizations;
    });

    const request = httpTesting.expectOne('/api/distributors');
    expect(request.request.method).toBe('GET');
    request.flush({
      content: [{ id: 'd-1', name: 'Northwind Distribution' }],
      totalElements: 1,
      totalPages: 1
    });

    expect(received).toEqual([{
      id: 'd-1',
      name: 'Northwind Distribution',
      type: 'DISTRIBUTOR'
    }]);
  });

  it('combines the manufacturer and distributor directories for organization selectors', () => {
    let received: Organization[] | undefined;

    service.getBusinessOrganizations().subscribe(organizations => {
      received = organizations;
    });

    httpTesting.expectOne('/api/manufacturers').flush([
      { id: 'm-1', name: 'Northwind Manufacturing' }
    ]);
    httpTesting.expectOne('/api/distributors').flush([
      { id: 'd-1', name: 'Northwind Distribution' }
    ]);

    expect(received?.map(organization => organization.id))
      .toEqual(['m-1', 'd-1']);
    expect(received?.map(organization => organization.type))
      .toEqual(['MANUFACTURER', 'DISTRIBUTOR']);
  });

  it('gets a manufacturer by encoded id', () => {
    let received: Organization | undefined;

    service.getManufacturer('manufacturer 1').subscribe(organization => {
      received = organization;
    });

    const request = httpTesting.expectOne('/api/manufacturers/manufacturer%201');
    expect(request.request.method).toBe('GET');
    request.flush({ id: 'manufacturer 1', name: 'Northwind Manufacturing' });

    expect(received?.type).toBe('MANUFACTURER');
  });

  it('gets a distributor by id', () => {
    let received: Organization | undefined;

    service.getDistributor('d-1').subscribe(organization => {
      received = organization;
    });

    const request = httpTesting.expectOne('/api/distributors/d-1');
    expect(request.request.method).toBe('GET');
    request.flush({ id: 'd-1', name: 'Northwind Distribution' });

    expect(received?.type).toBe('DISTRIBUTOR');
  });
});
