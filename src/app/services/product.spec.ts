import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { ProductService } from './product';

describe('ProductService categories', () => {
  let service: ProductService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ProductService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads categories from the shared product categories endpoint', () => {
    let categories: string[] | undefined;

    service.getCategories().subscribe(result => {
      categories = result;
    });

    const request = httpTesting.expectOne('/api/v1/products/categories');
    expect(request.request.method).toBe('GET');
    request.flush(['Food', 'Equipment']);

    expect(categories).toEqual(['Food', 'Equipment']);
  });

  it('filters product requests by category on the server', () => {
    service.getProducts(0, 20, '', 'Safety Equipment').subscribe();

    const request = httpTesting.expectOne(
      request => request.url === '/api/v1/products' &&
        request.params.get('category') === 'Safety Equipment'
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      content: [],
      totalElements: 0,
      totalPages: 0
    });
  });

  it('maps alternate product-stat field names used by the backend', () => {
    let stats:
      | {
          totalProducts: number;
          activeProducts: number;
          pendingProducts: number;
          categories: number;
        }
      | undefined;

    service.getProductStats().subscribe(result => {
      stats = result;
    });

    const request = httpTesting.expectOne('/api/v1/products/stats');
    request.flush({
      totalStockItems: 42,
      activeProductCount: 30,
      pendingProductCount: 5,
      categories: 4
    });

    expect(stats).toEqual({
      totalProducts: 42,
      activeProducts: 30,
      inactiveProducts: 0,
      pendingProducts: 5,
      categories: 4
    });
  });

  it('creates, renames, and deactivates global categories', () => {
    service.createCategory('Food').subscribe();
    const createRequest = httpTesting.expectOne(
      '/api/v1/products/categories'
    );
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual({ name: 'Food' });
    createRequest.flush(null);

    service.renameCategory('Old Category', 'New Category').subscribe();
    const renameRequest = httpTesting.expectOne(
      '/api/v1/products/categories/Old%20Category'
    );
    expect(renameRequest.request.method).toBe('PUT');
    expect(renameRequest.request.body).toEqual({ name: 'New Category' });
    renameRequest.flush(null);

    service.deactivateCategory('New Category').subscribe();
    const deactivateRequest = httpTesting.expectOne(
      '/api/v1/products/categories/New%20Category'
    );
    expect(deactivateRequest.request.method).toBe('DELETE');
    deactivateRequest.flush(null);
  });

  it('approves a pending product through the approval endpoint', () => {
    service.updateProductApproval('product-1', 'APPROVED').subscribe();

    const request = httpTesting.expectOne(
      '/api/v1/products/product-1/approval'
    );
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'APPROVED' });
    request.flush({
      id: 'product-1',
      name: 'Cement',
      sku: 'CEM-001',
      category: 'Construction',
      approvalStatus: 'APPROVED',
      active: true
    });
  });
});
