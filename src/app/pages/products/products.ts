import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';

import {
  ProductService,
  Product,
  ProductStats,
  CreateProductRequest
} from '../../services/product';

import {
  OrganizationService,
  Organization
} from '../../services/organization';

@Component({
  selector: 'app-products',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './products.html',
  styleUrl: './products.css'
})
export class Products implements OnInit {

  private productService = inject(ProductService);
  private organizationService = inject(OrganizationService);
  private changeDetectorRef = inject(ChangeDetectorRef);

  productStats: ProductStats = {
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    pendingProducts: 0,
    categories: 0
  };

  products: Product[] = [];
  categories: string[] = [];
  organizations: Organization[] = [];

  loading = false;
  loadingCategories = false;
  loadingOrganizations = false;

  errorMessage = '';
  categoriesError = '';

  searchTerm = '';
  currentPage = 0;
  pageSize = 20;

  totalElements = 0;
  totalPages = 1;

  showAddProductModal = false;
  savingProduct = false;
  addProductError = '';

  newProduct = {
    name: '',
    sku: '',
    category: '',
    organizationId: '',
    description: '',
    unitPrice: 0,
    stockQuantity: 0
  };

  showViewProductModal = false;
  selectedProduct: Product | null = null;

  loadingProduct = false;
  viewProductError = '';

  private searchTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
    this.loadProductStats();
    this.loadOrganizations();
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.categoriesError = '';

    this.productService
      .getCategories()
      .pipe(
        timeout({ first: 10000 }),
        finalize(() => {
          this.loadingCategories = false;
          this.changeDetectorRef.markForCheck();
        })
      )
      .subscribe({
        next: categories => {
          this.categories = [...new Set(
            categories.map(category => category.trim()).filter(Boolean)
          )].sort((a, b) => a.localeCompare(b));

          this.changeDetectorRef.markForCheck();
        },
        error: error => {
          console.error('Failed to load product categories:', error);
          this.categoriesError =
            'Unable to load categories. Product categories may be temporarily unavailable.';
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  loadProducts(): void {

    this.loading = true;
    this.errorMessage = '';

    this.productService
      .getProducts(
        this.currentPage,
        this.pageSize,
        this.searchTerm
      )
      .pipe(
        timeout({ first: 10000 }),
        finalize(() => {
          this.loading = false;
          this.changeDetectorRef.markForCheck();
        })
      )
      .subscribe({

        next: response => {

          this.products = response.content ?? [];

          this.totalElements =
            response.totalElements;

          this.totalPages =
            response.totalPages || 1;
          this.changeDetectorRef.markForCheck();
        },

        error: error => {

          console.error(
            'Failed to load products:',
            error
          );

          this.errorMessage =
            error?.name === 'TimeoutError'
              ? 'Loading products took too long. Please try again.'
              : 'Unable to load products. Please try again.';
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  loadProductStats(): void {

    this.productService
      .getProductStats()
      .pipe(
        timeout({ first: 10000 })
      )
      .subscribe({

        next: stats => {
          this.productStats = stats;
          this.changeDetectorRef.markForCheck();
        },

        error: error => {
          console.error(
            'Failed to load product statistics:',
            error
          );
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  loadOrganizations(): void {

    this.loadingOrganizations = true;

    this.organizationService
      .getBusinessOrganizations()
      .pipe(
        timeout({ first: 10000 }),

        finalize(() => {
          this.loadingOrganizations = false;
          this.changeDetectorRef.markForCheck();
        })
      )
      .subscribe({

        next: organizations => {
          this.organizations = organizations;
          this.changeDetectorRef.markForCheck();
        },

        error: error => {

          console.error(
            'Failed to load organizations:',
            error
          );
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  searchProducts(): void {

    this.currentPage = 0;

    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    this.searchTimer = setTimeout(() => {
      this.loadProducts();
    }, 350);
  }

  nextPage(): void {

    if (
      this.currentPage <
      this.totalPages - 1
    ) {

      this.currentPage++;

      this.loadProducts();
    }
  }

  previousPage(): void {

    if (this.currentPage > 0) {

      this.currentPage--;

      this.loadProducts();
    }
  }

  openAddProductModal(): void {

    this.addProductError = '';

    this.newProduct = {
      name: '',
      sku: '',
      category: this.categories[0] ?? '',
      organizationId: '',
      description: '',
      unitPrice: 0,
      stockQuantity: 0
    };

    this.showAddProductModal = true;

    if (
      !this.organizations.length &&
      !this.loadingOrganizations
    ) {
      this.loadOrganizations();
    }
  }

  closeAddProductModal(): void {

    if (this.savingProduct) {
      return;
    }

    this.showAddProductModal = false;
    this.addProductError = '';
  }

  saveProduct(): void {

    this.addProductError = '';

    const name =
      this.newProduct.name.trim();

    const sku =
      this.newProduct.sku.trim();

    const description =
      this.newProduct.description.trim();

    if (
      !name ||
      !sku ||
      !this.newProduct.category ||
      !this.categories.includes(this.newProduct.category)
    ) {

      this.addProductError =
        'Please fill in all required fields and select a valid category.';

      return;
    }

    if (this.newProduct.unitPrice < 0) {

      this.addProductError =
        'Unit price cannot be negative.';

      return;
    }

    if (this.newProduct.stockQuantity < 0) {

      this.addProductError =
        'Stock quantity cannot be negative.';

      return;
    }

    if (!this.newProduct.organizationId) {

      this.addProductError =
        'Please select an organization.';

      return;
    }

    const payload: CreateProductRequest = {

      name,

      sku,

      category:
        this.newProduct.category,

      organizationId:
        this.newProduct.organizationId,

      description:
        description || undefined,

      unitPrice:
        this.newProduct.unitPrice,

      quantityOnHand:
        this.newProduct.stockQuantity,

      reorderThreshold: 0,

      active: false,

      approvalStatus: 'PENDING'
    };

    this.savingProduct = true;

    this.productService
      .createProduct(payload)
      .pipe(

        timeout({ first: 10000 }),

        finalize(() => {
          this.savingProduct = false;
          this.changeDetectorRef.markForCheck();
        })
      )
      .subscribe({

        next: product => {

          console.log(
            'Product created successfully:',
            product
          );

          this.showAddProductModal = false;

          this.loadProducts();

          this.loadProductStats();
          this.changeDetectorRef.markForCheck();
        },

        error: error => {

          console.error(
            'Failed to create product:',
            error
          );

          this.addProductError =
            error?.name === 'TimeoutError'
              ? 'Product creation timed out. Please check the backend and try again.'
              : error?.error?.message ||
                error?.error?.error ||
                'Unable to create product. Please try again.';
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  viewProduct(productId: string): void {

    this.viewProductError = '';
    this.selectedProduct = null;

    this.loadingProduct = true;
    this.showViewProductModal = true;

    this.productService
      .getProduct(productId)
      .pipe(

        timeout({ first: 10000 }),

        finalize(() => {
          this.loadingProduct = false;
          this.changeDetectorRef.markForCheck();
        })
      )
      .subscribe({

        next: product => {
          this.selectedProduct = product;
          this.changeDetectorRef.markForCheck();
        },

        error: error => {

          console.error(
            'Failed to load product:',
            error
          );

          this.viewProductError =
            error?.name === 'TimeoutError'
              ? 'Loading product details took too long.'
              : error?.error?.message ||
                'Unable to load product details. Please try again.';
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  closeViewProductModal(): void {

    if (this.loadingProduct) {
      return;
    }

    this.showViewProductModal = false;
    this.selectedProduct = null;
    this.viewProductError = '';
  }
}
