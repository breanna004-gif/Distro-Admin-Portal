import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs';

import { ProductService } from '../../services/product';

@Component({
  selector: 'app-product-categories',
  imports: [FormsModule, RouterLink],
  templateUrl: './product-categories.html',
  styleUrl: './product-categories.css'
})
export class ProductCategories implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  categories: string[] = [];
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  newCategoryName = '';
  editingCategory: string | null = null;
  editedCategoryName = '';
  busyCategory: string | null = null;

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.errorMessage = '';

    this.productService
      .getCategories()
      .pipe(
        timeout({ first: 10000 }),
        finalize(() => {
          this.loading = false;
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
          this.errorMessage = this.errorText(
            error,
            'Unable to load product categories.'
          );
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  createCategory(): void {
    const name = this.newCategoryName.trim();
    this.errorMessage = '';
    this.successMessage = '';

    if (!name) {
      this.errorMessage = 'Enter a category name.';
      return;
    }

    if (this.hasDuplicate(name)) {
      this.errorMessage = 'A category with this name already exists.';
      return;
    }

    this.saving = true;
    this.productService
      .createCategory(name)
      .pipe(
        timeout({ first: 10000 }),
        finalize(() => {
          this.saving = false;
          this.changeDetectorRef.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.newCategoryName = '';
          this.successMessage = `Category "${name}" was added.`;
          this.loadCategories();
        },
        error: error => {
          console.error('Failed to create product category:', error);
          this.errorMessage = this.errorText(
            error,
            'Unable to create the category.'
          );
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  beginRename(category: string): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.editingCategory = category;
    this.editedCategoryName = category;
  }

  cancelRename(): void {
    this.editingCategory = null;
    this.editedCategoryName = '';
  }

  renameCategory(category: string): void {
    const name = this.editedCategoryName.trim();
    this.errorMessage = '';
    this.successMessage = '';

    if (!name) {
      this.errorMessage = 'Enter a category name.';
      return;
    }

    if (name === category) {
      this.cancelRename();
      return;
    }

    if (this.hasDuplicate(name)) {
      this.errorMessage = 'A category with this name already exists.';
      return;
    }

    this.busyCategory = category;
    this.productService
      .renameCategory(category, name)
      .pipe(
        timeout({ first: 10000 }),
        finalize(() => {
          this.busyCategory = null;
          this.changeDetectorRef.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.cancelRename();
          this.successMessage = `Category renamed to "${name}".`;
          this.loadCategories();
        },
        error: error => {
          console.error('Failed to rename product category:', error);
          this.errorMessage = this.errorText(
            error,
            'Unable to rename the category.'
          );
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  deactivateCategory(category: string): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!window.confirm(
      `Deactivate "${category}"? Existing products keep this category, but it will no longer be available for new products.`
    )) {
      return;
    }

    this.busyCategory = category;
    this.productService
      .deactivateCategory(category)
      .pipe(
        timeout({ first: 10000 }),
        finalize(() => {
          this.busyCategory = null;
          this.changeDetectorRef.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.successMessage = `Category "${category}" was deactivated.`;
          this.loadCategories();
        },
        error: error => {
          console.error('Failed to deactivate product category:', error);
          this.errorMessage = this.errorText(
            error,
            'Unable to deactivate the category.'
          );
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  private hasDuplicate(name: string): boolean {
    return this.categories.some(
      category => category.toLocaleLowerCase() === name.toLocaleLowerCase()
    );
  }

  private errorText(error: any, fallback: string): string {
    const message = error?.error?.message ?? error?.error?.error;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    if (error?.name === 'TimeoutError') {
      return 'The request timed out. Please try again.';
    }

    if (error?.status === 401 || error?.status === 403) {
      return 'You are not authorized to manage product categories.';
    }

    return fallback;
  }
}
