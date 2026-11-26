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

interface BackendStockRecord extends Record<string, unknown> {
  id?: string;
  sku?: string;
  name?: string;
  productName?: string;
  organizationId?: string;
  organizationName?: string;
  warehouseId?: string;
  warehouseName?: string;
  quantity?: number;
  quantityOnHand?: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  reorderLevel?: number;
  reorderThreshold?: number;
  unitPrice?: number;
  lowStock?: boolean;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastUpdated?: string;
  status?: InventoryItem['status'];
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
              const quantity = Number(
                record.quantityOnHand ?? record.quantity ?? 0
              );
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
  ): Observable<{
    content: InventoryItem[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  }> {

    return this.http
      .get<unknown>(
        this.apiUrl,
        {
          headers: this.getHeaders()
        }
      )
      .pipe(
        map(response => {
          let inventory = this.unwrapStockRecords(response)
            .map(record => this.mapStockItem(record));

          if (search.trim()) {
            const term =
              search.trim().toLowerCase();

            inventory = inventory.filter(
              item =>
                item.productName.toLowerCase().includes(term) ||
                item.sku.toLowerCase().includes(term) ||
                (item.organizationName ?? '').toLowerCase().includes(term) ||
                (item.warehouseName ?? '').toLowerCase().includes(term)
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

    return this.http.get<BackendStockRecord>(
      `${this.apiUrl}/${inventoryId}`,
      {
        headers: this.getHeaders()
      }
    ).pipe(map(record => this.mapStockItem(record)));
  }

  createInventory(
    inventory: Partial<InventoryItem>
  ): Observable<InventoryItem> {

    return this.http.post<BackendStockRecord>(
      this.apiUrl,
      inventory,
      {
        headers: this.getHeaders()
      }
    ).pipe(map(record => this.mapStockItem(record)));
  }

  updateInventory(
    inventoryId: string,
    inventory: Partial<InventoryItem>
  ): Observable<InventoryItem> {

    return this.http.patch<BackendStockRecord>(
      `${this.apiUrl}/${inventoryId}`,
      inventory,
      {
        headers: this.getHeaders()
      }
    ).pipe(map(record => this.mapStockItem(record)));
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

  private mapStockItem(record: BackendStockRecord): InventoryItem {
    const quantity = Number(record.quantityOnHand ?? record.quantity ?? 0);
    const reserved = Number(record.reservedQuantity ?? 0);
    const available = Number(
      record.availableQuantity ?? (quantity - reserved)
    );
    const reorderLevel = Number(
      record.reorderLevel ?? record.reorderThreshold ?? 0
    );
    const productName = String(
      record.productName ?? record.name ?? ''
    ).trim();
    const id = String(record.id ?? '');

    return {
      id,
      productId: id,
      productName: productName || 'Unnamed product',
      sku: String(record.sku ?? ''),
      organizationId: record.organizationId
        ? String(record.organizationId)
        : undefined,
      organizationName: record.organizationName
        ? String(record.organizationName)
        : undefined,
      warehouseId: record.warehouseId
        ? String(record.warehouseId)
        : undefined,
      warehouseName: record.warehouseName
        ? String(record.warehouseName)
        : undefined,
      quantity: Number.isFinite(quantity) ? quantity : 0,
      reservedQuantity: Number.isFinite(reserved) ? reserved : 0,
      availableQuantity: Number.isFinite(available) ? available : 0,
      reorderLevel: Number.isFinite(reorderLevel) ? reorderLevel : 0,
      unitPrice: record.unitPrice == null ? undefined : Number(record.unitPrice),
      status: this.resolveStatus(record, available, reorderLevel),
      lastUpdated: record.lastUpdated
        ? String(record.lastUpdated)
        : record.updatedAt
          ? String(record.updatedAt)
          : undefined,
      createdAt: record.createdAt ? String(record.createdAt) : undefined
    };
  }

  private resolveStatus(
    record: BackendStockRecord,
    available: number,
    reorderLevel: number
  ): InventoryItem['status'] {
    if (record.status === 'IN_STOCK'
      || record.status === 'LOW_STOCK'
      || record.status === 'OUT_OF_STOCK'
      || record.status === 'OVERSTOCKED') {
      return record.status;
    }
    if (available <= 0) {
      return 'OUT_OF_STOCK';
    }
    if (record.lowStock === true || available <= reorderLevel) {
      return 'LOW_STOCK';
    }
    return 'IN_STOCK';
  }

  private unwrapStockRecords(
    response: unknown,
    depth = 0
  ): BackendStockRecord[] {
    if (Array.isArray(response)) {
      return response as BackendStockRecord[];
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
        return value as BackendStockRecord[];
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
