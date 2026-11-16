import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { InventoryService } from './inventory';

describe('InventoryService', () => {
  let service: InventoryService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(InventoryService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('sums quantityOnHand values from the admin stock endpoint', () => {
    let totalStockUnits: number | undefined;

    service.getTotalStockUnits().subscribe(total => {
      totalStockUnits = total;
    });

    const request = httpTesting.expectOne('/api/admin/stock');
    expect(request.request.method).toBe('GET');
    request.flush([
      { id: 'stock-1', quantityOnHand: 10 },
      { id: 'stock-2', quantityOnHand: 7 }
    ]);

    expect(totalStockUnits).toBe(17);
  });

  it('sums stock quantities from a wrapped API collection response', () => {
    let totalStockUnits: number | undefined;

    service.getTotalStockUnits().subscribe(total => {
      totalStockUnits = total;
    });

    const request = httpTesting.expectOne('/api/admin/stock');
    request.flush({
      data: {
        content: [
          { id: 'stock-1', quantityOnHand: 10 },
          { id: 'stock-2', quantityOnHand: 7 }
        ]
      }
    });

    expect(totalStockUnits).toBe(17);
  });

  it('reports an invalid stock response instead of reducing a non-array value', () => {
    let error: unknown;

    service.getTotalStockUnits().subscribe({
      error: responseError => {
        error = responseError;
      }
    });

    const request = httpTesting.expectOne('/api/admin/stock');
    request.flush({ message: 'Unexpected response' });

    expect(error).toBeInstanceOf(TypeError);
    expect((error as Error).message).toContain(
      'unsupported collection response'
    );
  });
});
