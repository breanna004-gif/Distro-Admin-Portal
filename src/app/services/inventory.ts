import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface InventoryItem {
  id: string;

  productId: string;
  productName: string;
  sku: string;

  organizationId?: string;
  organizationName?: string;

  warehouseId?: string;
  warehouseName?: string;

  quantity: number;
  reservedQuantity?: number;
  availableQuantity?: number;

  reorderLevel?: number;

  unitPrice?: number;

  status:
    | 'IN_STOCK'
    | 'LOW_STOCK'
    | 'OUT_OF_STOCK'
    | 'OVERSTOCKED';

  lastUpdated?: string;
  createdAt?: string;
}

interface BackendStockQuantity extends Record<string, unknown> {
  quantityOnHand: number;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {

  private http = inject(HttpClient);

  private readonly apiUrl =
    '/api/admin/stock';

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getTotalStockUnits(): Observable<number> {
    return this.http
      .get<unknown>(
        this.apiUrl,
        {
          headers: this.getHeaders()
        }
      )
      .pipe(
        map(response =>
          this.unwrapStockRecords(response).reduce(
            (total, record) => {
              const quantity = Number(record.quantityOnHand ?? 0);
              if (!Number.isFinite(quantity)) {
                throw new TypeError(
                  'The stock API returned an invalid quantityOnHand value.'
                );
              }
              return total + quantity;
            },
            0
          )
        )
      );
  }

  getInventory(
    page: number = 0,
    size: number = 20,
    search: string = ''
  ): Observable<any> {

    return this.http
      .get<unknown>(
        this.apiUrl,
        {
          headers: this.getHeaders()
        }
      )
      .pipe(
        map(response => {
          let inventory = this.unwrapStockRecords(response);

          if (search.trim()) {
            const term =
              search.trim().toLowerCase();

            inventory = inventory.filter(
              item =>
                String(item['productName'] ?? '')
                  .toLowerCase()
                  .includes(term) ||
                String(item['sku'] ?? '')
                  .toLowerCase()
                  .includes(term) ||
                String(item['organizationName'] ?? '')
                  .toLowerCase()
                  .includes(term) ||
                String(item['warehouseName'] ?? '')
                  .toLowerCase()
                  .includes(term)
            );
          }

          const totalElements =
            inventory.length;

          const start =
            page * size;

          const end =
            start + size;

          const content =
            inventory.slice(start, end);

          return {
            content,
            totalElements,
            totalPages: Math.max(
              1,
              Math.ceil(
                totalElements / size
              )
            ),
            size,
            number: page
          };
        })
      );
  }

  getInventoryItem(
    inventoryId: string
  ): Observable<InventoryItem> {

    return this.http.get<InventoryItem>(
      `${this.apiUrl}/${inventoryId}`,
      {
        headers: this.getHeaders()
      }
    );
  }

  createInventory(
    inventory: Partial<InventoryItem>
  ): Observable<InventoryItem> {

    return this.http.post<InventoryItem>(
      this.apiUrl,
      inventory,
      {
        headers: this.getHeaders()
      }
    );
  }

  updateInventory(
    inventoryId: string,
    inventory: Partial<InventoryItem>
  ): Observable<InventoryItem> {

    return this.http.patch<InventoryItem>(
      `${this.apiUrl}/${inventoryId}`,
      inventory,
      {
        headers: this.getHeaders()
      }
    );
  }

  getInventoryMovements(
    inventoryId: string
  ): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/${inventoryId}/movements`,
      {
        headers: this.getHeaders()
      }
    );
  }

  getInventoryAlerts(): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/alerts`,
      {
        headers: this.getHeaders()
      }
    );
  }

  private unwrapStockRecords(
    response: unknown,
    depth = 0
  ): BackendStockQuantity[] {
    if (Array.isArray(response)) {
    return response as BackendStockQuantity[];
    }

    if (
    typeof response !== 'object' ||
    response === null ||
    depth >= 3
    ) {
    throw new TypeError(
      'The stock API returned an unsupported collection response.'
    );
    }

    const record = response as Record<string, unknown>;
    for (const key of ['content', 'data', 'items', 'records', 'results']) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value as BackendStockQuantity[];
    }

    if (typeof value === 'object' && value !== null) {
      return this.unwrapStockRecords(value, depth + 1);
    }
    }

    throw new TypeError(
    'The stock API returned an unsupported collection response.'
    );
  }
}
