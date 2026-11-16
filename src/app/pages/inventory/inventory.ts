import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  InventoryService,
  InventoryItem
} from '../../services/inventory';
import { ReportColumn, ReportRow } from '../../models/report.model';
import { ReportDownload } from '../../shared/components/report-download/report-download';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [FormsModule, DecimalPipe, ReportDownload],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css'
})
export class Inventory implements OnInit {
  readonly reportColumns: ReportColumn[] = [
    { key: 'productName', header: 'Product' },
    { key: 'sku', header: 'SKU' },
    { key: 'organizationName', header: 'Organization' },
    { key: 'warehouseName', header: 'Warehouse' },
    { key: 'quantity', header: 'Quantity' },
    { key: 'reservedQuantity', header: 'Reserved' },
    { key: 'availableQuantity', header: 'Available' },
    { key: 'reorderLevel', header: 'Reorder Level' },
    { key: 'unitPrice', header: 'Unit Price' },
    { key: 'status', header: 'Status' },
    { key: 'lastUpdated', header: 'Last Updated' }
  ];

  private inventoryService = inject(InventoryService);
  private changeDetectorRef = inject(ChangeDetectorRef);

  inventory: InventoryItem[] = [];
  filteredInventory: InventoryItem[] = [];

  get reportData(): ReportRow[] {
    return this.filteredInventory.map(item => ({
      productName: item.productName,
      sku: item.sku,
      organizationName: item.organizationName,
      warehouseName: item.warehouseName,
      quantity: item.quantity,
      reservedQuantity: item.reservedQuantity,
      availableQuantity: item.availableQuantity ??
        item.quantity - (item.reservedQuantity ?? 0),
      reorderLevel: item.reorderLevel,
      unitPrice: item.unitPrice,
      status: item.status,
      lastUpdated: item.lastUpdated
    }));
  }

  loading = false;
  errorMessage = '';

  searchTerm = '';

  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 1;

  showAddInventoryModal = false;
  savingInventory = false;
  addInventoryError = '';

  showViewInventoryModal = false;
  selectedInventory: InventoryItem | null = null;
  loadingInventory = false;
  viewInventoryError = '';

  newInventory = {
    productName: '',
    sku: '',
    organizationName: '',
    warehouseName: '',
    quantity: 0,
    reservedQuantity: 0,
    reorderLevel: 10,
    unitPrice: 0
  };

  ngOnInit(): void {
    this.loadInventory();
  }

  // ================================================================
  // LOAD INVENTORY
  // ================================================================

  loadInventory(): void {
    this.loading = true;
    this.errorMessage = '';

    this.inventoryService
      .getInventory(
        this.currentPage,
        this.pageSize,
        this.searchTerm.trim()
      )
      .subscribe({
        next: (response: any) => {
          const records: InventoryItem[] =
            Array.isArray(response)
              ? response
              : response?.content ?? [];

          this.inventory = records;
          this.filteredInventory = records;

          this.totalElements =
            response?.totalElements ??
            records.length;

          this.totalPages =
            response?.totalPages ??
            Math.max(
              1,
              Math.ceil(this.totalElements / this.pageSize)
            );

          this.loading = false;
          this.changeDetectorRef.markForCheck();
        },

        error: (error: any) => {
          console.error('Failed to load inventory:', error);

          this.inventory = [];
          this.filteredInventory = [];
          this.totalElements = 0;
          this.totalPages = 1;

          this.errorMessage =
            error?.error?.message ||
            'Unable to load inventory. Please try again.';

          this.loading = false;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  searchInventory(): void {
    this.currentPage = 0;
    this.loadInventory();
  }

  // ================================================================
  // KPI DATA
  // ================================================================

  get totalInventoryItems(): number {
    return this.inventory.length;
  }

  get inStockCount(): number {
    return this.inventory.filter(
      item => item.status === 'IN_STOCK'
    ).length;
  }

  get lowStockCount(): number {
    return this.inventory.filter(
      item => item.status === 'LOW_STOCK'
    ).length;
  }

  get outOfStockCount(): number {
    return this.inventory.filter(
      item => item.status === 'OUT_OF_STOCK'
    ).length;
  }

  // ================================================================
  // PAGINATION
  // ================================================================

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadInventory();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadInventory();
    }
  }

  // ================================================================
  // ADD INVENTORY
  // ================================================================

  openAddInventoryModal(): void {
    this.addInventoryError = '';

    this.newInventory = {
      productName: '',
      sku: '',
      organizationName: '',
      warehouseName: '',
      quantity: 0,
      reservedQuantity: 0,
      reorderLevel: 10,
      unitPrice: 0
    };

    this.showAddInventoryModal = true;
  }

  closeAddInventoryModal(): void {
    if (this.savingInventory) {
      return;
    }

    this.showAddInventoryModal = false;
    this.addInventoryError = '';
  }

  saveInventory(): void {
    this.addInventoryError = '';

    const productName =
      this.newInventory.productName.trim();

    const sku =
      this.newInventory.sku.trim();

    const organizationName =
      this.newInventory.organizationName.trim();

    if (!productName || !sku) {
      this.addInventoryError =
        'Please enter the product name and SKU.';
      return;
    }

    if (
      this.newInventory.quantity < 0 ||
      this.newInventory.reservedQuantity < 0 ||
      this.newInventory.reorderLevel < 0 ||
      this.newInventory.unitPrice < 0
    ) {
      this.addInventoryError =
        'Inventory values cannot be negative.';
      return;
    }

    if (
      this.newInventory.reservedQuantity >
      this.newInventory.quantity
    ) {
      this.addInventoryError =
        'Reserved quantity cannot exceed total quantity.';
      return;
    }

    this.savingInventory = true;

    const payload: Partial<InventoryItem> = {
      productName,
      sku,
      organizationName:
        organizationName || undefined,

      warehouseName:
        this.newInventory.warehouseName || undefined,

      quantity:
        this.newInventory.quantity,

      reservedQuantity:
        this.newInventory.reservedQuantity,

      availableQuantity:
        this.newInventory.quantity -
        this.newInventory.reservedQuantity,

      reorderLevel:
        this.newInventory.reorderLevel,

      unitPrice:
        this.newInventory.unitPrice
    };

    this.inventoryService
      .createInventory(payload)
      .subscribe({
        next: () => {
          this.savingInventory = false;
          this.showAddInventoryModal = false;
          this.loadInventory();
          this.changeDetectorRef.markForCheck();
        },

        error: (error: any) => {
          console.error(
            'Failed to create inventory:',
            error
          );

          this.addInventoryError =
            error?.error?.message ||
            'Unable to create inventory record. Please try again.';

          this.savingInventory = false;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  // ================================================================
  // VIEW INVENTORY
  // ================================================================

  viewInventory(inventoryId: string): void {
    this.viewInventoryError = '';
    this.selectedInventory = null;
    this.loadingInventory = true;
    this.showViewInventoryModal = true;

    this.inventoryService
      .getInventoryItem(inventoryId)
      .subscribe({
        next: (inventoryItem: InventoryItem) => {
          this.selectedInventory = inventoryItem;
          this.loadingInventory = false;
          this.changeDetectorRef.markForCheck();
        },

        error: (error: any) => {
          console.error(
            'Failed to load inventory record:',
            error
          );

          this.viewInventoryError =
            error?.error?.message ||
            'Unable to load inventory details. Please try again.';

          this.loadingInventory = false;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  closeViewInventoryModal(): void {
    if (this.loadingInventory) {
      return;
    }

    this.showViewInventoryModal = false;
    this.selectedInventory = null;
    this.viewInventoryError = '';
  }

  // ================================================================
  // WAREHOUSES
  // ================================================================

  get warehouses(): string[] {
    const values = this.inventory
      .map(item => item.warehouseName)
      .filter(
        (warehouse): warehouse is string =>
          !!warehouse
      );

    return [...new Set(values)];
  }
}
