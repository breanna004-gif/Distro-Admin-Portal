import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export type ProductApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export type ProductStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'DISCONTINUED'
  | 'PENDING';

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  pendingProducts: number;
  categories: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;

  organizationId?: string;
  organizationName?: string;

  description?: string;
  unitPrice?: number;

  stockQuantity?: number;
  quantityOnHand?: number;
  reorderThreshold?: number;

  active?: boolean;
  approvalStatus?: ProductApprovalStatus;

  status: ProductStatus;

  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductRequest {
  name: string;
  sku: string;
  category: string;
  organizationId?: string;
  description?: string;
  unitPrice: number;
  quantityOnHand: number;
  reorderThreshold?: number;
  active: boolean;
  approvalStatus: ProductApprovalStatus;
}

interface BackendStockItem {
  id: string;
  name: string;
  sku: string;
  category: string;

  organizationId?: string;
  organizationName?: string;

  description?: string;
  unitPrice?: number;

  quantityOnHand?: number;
  reorderThreshold?: number;

  active?: boolean;
  approvalStatus?: ProductApprovalStatus;

  createdAt?: string;
  updatedAt?: string;
}

interface BackendProductStats {
  totalProducts?: number;
  total?: number;
  productCount?: number;
  totalStockItems?: number;
  activeProducts?: number;
  activeProductCount?: number;
  inactiveProducts?: number;
  inactiveProductCount?: number;
  pendingProducts?: number;
  pendingProductCount?: number;
  categories?: number;
}

export interface ProductPage {
  content: Product[];
  totalElements: number;
  totalPages: number;
  number?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private http = inject(HttpClient);

  private readonly apiUrl =
    '/api/v1/products';

  getProducts(
    page: number = 0,
    size: number = 20,
    search: string = '',
    category: string = ''
  ): Observable<ProductPage> {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    if (category.trim()) {
      params = params.set('category', category.trim());
    }

    return this.http
      .get<BackendStockItem[] | ProductPage>(
        this.apiUrl,
        { params }
      )
      .pipe(
        map(response => {

          const backendItems =
            Array.isArray(response)
              ? response
              : response.content as unknown as BackendStockItem[];

          return {
            content: backendItems.map(
              item => this.toProduct(item)
            ),

            totalElements:
              Array.isArray(response)
                ? backendItems.length
                : response.totalElements,

            totalPages:
              Array.isArray(response)
                ? 1
                : response.totalPages,

            number:
              Array.isArray(response)
                ? page
                : response.number,

            size:
              Array.isArray(response)
                ? size
                : response.size
          };
        })
      );
  }

  getProduct(
    productId: string
  ): Observable<Product> {

    return this.http
      .get<BackendStockItem>(
        `${this.apiUrl}/${productId}`
      )
      .pipe(
        map(item => this.toProduct(item))
      );
  }

  createProduct(
    product: CreateProductRequest
  ): Observable<Product> {

    return this.http
      .post<BackendStockItem>(
        this.apiUrl,
        product
      )
      .pipe(
        map(item => this.toProduct(item))
      );
  }

  updateProduct(
    productId: string,
    product: Partial<CreateProductRequest>
  ): Observable<Product> {

    return this.http
      .put<BackendStockItem>(
        `${this.apiUrl}/${productId}`,
        product
      )
      .pipe(
        map(item => this.toProduct(item))
      );
  }

  updateProductStatus(
    productId: string,
    status: ProductStatus
  ): Observable<Product> {

    return this.http
      .patch<BackendStockItem>(
        `${this.apiUrl}/${productId}/status`,
        { status }
      )
      .pipe(
        map(item => this.toProduct(item))
      );
  }

  getProductInventory(
    productId: string
  ): Observable<BackendStockItem> {

    return this.http.get<BackendStockItem>(
      `${this.apiUrl}/${productId}/inventory`
    );
  }

  getCategories(): Observable<string[]> {

    return this.http.get<string[]>(
      `${this.apiUrl}/categories`
    );
  }

  createCategory(name: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/categories`,
      { name }
    );
  }

  renameCategory(
    currentName: string,
    name: string
  ): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/categories/${encodeURIComponent(currentName)}`,
      { name }
    );
  }

  deactivateCategory(name: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/categories/${encodeURIComponent(name)}`
    );
  }

  getProductStats(): Observable<ProductStats> {

    return this.http
      .get<BackendProductStats>(
        `${this.apiUrl}/stats`
      )
      .pipe(
        map(stats => ({
          totalProducts:
            stats.totalProducts ??
            stats.total ??
            stats.productCount ??
            stats.totalStockItems ??
            0,
          activeProducts:
            stats.activeProducts ??
            stats.activeProductCount ??
            0,
          inactiveProducts:
            stats.inactiveProducts ??
            stats.inactiveProductCount ??
            0,
          pendingProducts:
            stats.pendingProducts ??
            stats.pendingProductCount ??
            0,
          categories: stats.categories ?? 0
        }))
      );
  }

  updateProductApproval(
    productId: string,
    status: ProductApprovalStatus
  ): Observable<Product> {

    return this.http
      .patch<BackendStockItem>(
        `${this.apiUrl}/${productId}/approval`,
        { status }
      )
      .pipe(
        map(item => this.toProduct(item))
      );
  }

  private toProduct(
    item: BackendStockItem
  ): Product {

    const approvalStatus =
      item.approvalStatus ?? 'PENDING';

    const active =
      item.active ?? false;

    let status: ProductStatus;

    if (approvalStatus === 'PENDING') {

      status = 'PENDING';

    } else if (approvalStatus === 'REJECTED') {

      status = 'DISCONTINUED';

    } else {

      status = active
        ? 'ACTIVE'
        : 'INACTIVE';
    }

    return {
      id: item.id,
      name: item.name,
      sku: item.sku,
      category: item.category,

      organizationId:
        item.organizationId,

      organizationName:
        item.organizationName,

      description:
        item.description,

      unitPrice:
        item.unitPrice,

      stockQuantity:
        item.quantityOnHand ?? 0,

      quantityOnHand:
        item.quantityOnHand ?? 0,

      reorderThreshold:
        item.reorderThreshold ?? 0,

      active,

      approvalStatus,

      status,

      createdAt:
        item.createdAt,

      updatedAt:
        item.updatedAt
    };
  }
}
