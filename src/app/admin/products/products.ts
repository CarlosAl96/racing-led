import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Product } from '../../core/models/product';
import { DolarAPIService } from '../../core/services/dolar-api.service';
import { ProductsService } from '../../core/services/products.service';
import { ToastService } from '../../core/services/toast.service';
import { NewProduct } from './new-product/new-product';

interface CategoryOption {
  label: string;
  value: string;
}

interface ProductsTablePageEvent {
  first?: number | null;
  rows?: number | null;
}

@Component({
  selector: 'app-products',
  imports: [
    ButtonModule,
    ConfirmDialogModule,
    DatePipe,
    DecimalPipe,
    DynamicDialogModule,
    InputTextModule,
    ReactiveFormsModule,
    SelectModule,
    TableModule,
  ],
  providers: [ConfirmationService, DialogService],
  templateUrl: './products.html',
  styleUrl: './products.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Products implements OnInit, OnDestroy {
  private readonly productsService = inject(ProductsService);
  private readonly dolarApiService = inject(DolarAPIService);
  private readonly toastService = inject(ToastService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly dialogService = inject(DialogService);
  private productsRequestSubscription?: Subscription;
  private dialogCloseSubscription?: Subscription;
  private dialogRef: DynamicDialogRef | null = null;

  protected readonly rows = 20;
  protected readonly fallbackImage = 'assets/product-placeholder.jpg';
  protected readonly currentPageReportTemplate =
    'Mostrando {first} a {last} de {totalRecords} productos';
  protected readonly filtersForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    category: new FormControl('', { nonNullable: true }),
  });
  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<string[]>([]);
  protected readonly totalRecords = signal(0);
  protected readonly exchangeRate = signal<number | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isLoadingCategories = signal(false);
  protected readonly deletingProductId = signal<number | null>(null);
  protected readonly first = signal(0);
  protected readonly appliedSearch = signal('');
  protected readonly appliedCategory = signal('');
  protected readonly hasProducts = computed(() => this.products().length > 0);
  protected readonly hasActiveFilters = computed(
    () => !!this.appliedSearch() || !!this.appliedCategory(),
  );
  protected readonly categoryOptions = computed<CategoryOption[]>(() => [
    { label: 'Todas las categorías', value: '' },
    ...this.categories().map((category) => ({
      label: category,
      value: category,
    })),
  ]);

  ngOnInit(): void {
    this.loadCategories();
    this.loadExchangeRate();
  }

  ngOnDestroy(): void {
    this.productsRequestSubscription?.unsubscribe();
    this.dialogCloseSubscription?.unsubscribe();
    this.dialogRef?.close();
  }

  protected openProductModal(product?: Product): void {
    this.dialogCloseSubscription?.unsubscribe();

    this.dialogRef = this.dialogService.open(NewProduct, {
      header: product ? 'Editar producto' : 'Agregar producto',
      modal: true,
      width: 'min(92vw, 42rem)',
      dismissableMask: true,
      closable: true,
      data: {
        product,
        categories: this.categories(),
      },
    });

    if (!this.dialogRef) {
      return;
    }

    this.dialogCloseSubscription = this.dialogRef.onClose.subscribe((result?: { saved?: boolean }) => {
      if (!result?.saved) {
        return;
      }

      this.loadProducts(this.getCurrentPage());
    });
  }

  protected applyFilters(): void {
    this.appliedSearch.set(this.filtersForm.controls.search.value.trim());
    this.appliedCategory.set(this.filtersForm.controls.category.value.trim());
    this.first.set(0);
    this.loadProducts(1);
  }

  protected clearFilters(): void {
    this.filtersForm.setValue({
      search: '',
      category: '',
    });
    this.appliedSearch.set('');
    this.appliedCategory.set('');
    this.first.set(0);
    this.loadProducts(1);
  }

  protected onLazyLoad(event: ProductsTablePageEvent): void {
    const nextFirst = event.first ?? 0;
    const nextRows = event.rows || this.rows;
    const nextPage = Math.floor(nextFirst / nextRows) + 1;

    this.first.set(nextFirst);
    this.loadProducts(nextPage);
  }

  protected resolveImage(urlImage: string): string {
    if (!urlImage || !urlImage.trim()) {
      return this.fallbackImage;
    }

    return urlImage;
  }

  protected onImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.src = this.fallbackImage;
  }

  protected resolvePriceBs(priceUsd: number): number | null {
    const rate = this.exchangeRate();
    return rate === null ? null : priceUsd * rate;
  }

  protected confirmDeleteProduct(product: Product): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Seguro que deseas eliminar el producto ${product.name}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deleteProduct(product);
      },
    });
  }

  private loadProducts(page: number): void {
    this.productsRequestSubscription?.unsubscribe();
    this.isLoading.set(true);

    this.productsRequestSubscription = this.productsService
      .getProducts({
        page,
        limit: this.rows,
        search: this.appliedSearch() || undefined,
        category: this.appliedCategory() || undefined,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.products.set(response.data);
          this.totalRecords.set(response.pagination.total_records);
          this.first.set((response.pagination.current_page - 1) * response.pagination.limit);
        },
        error: () => {
          this.products.set([]);
          this.totalRecords.set(0);
          this.first.set(0);
        },
      });
  }

  private deleteProduct(product: Product): void {
    this.deletingProductId.set(product.id);

    this.productsService
        .deleteProduct(product.id)
      .pipe(finalize(() => this.deletingProductId.set(null)))
      .subscribe({
        next: () => {
          this.toastService.setMessage({
            severity: 'success',
            summary: 'Producto eliminado',
            detail: 'El producto se eliminó correctamente.',
          });
          this.loadProducts(this.getCurrentPage());
        },
        error: (error: unknown) => {
          const detail =
            typeof error === 'string'
              ? error
              : 'No se pudo eliminar el producto. Intenta nuevamente.';

          this.toastService.setMessage({
            severity: 'error',
            summary: 'Error al eliminar',
            detail,
          });
        },
      });
  }

  private getCurrentPage(): number {
    return Math.floor(this.first() / this.rows) + 1;
  }

  private loadExchangeRate(): void {
    this.dolarApiService.getParallelRate().subscribe({
      next: (response) => {
        this.exchangeRate.set(response.promedio ?? null);
      },
      error: () => {
        this.exchangeRate.set(null);
      },
    });
  }

  private loadCategories(): void {
    this.isLoadingCategories.set(true);

    this.productsService
      .getCategories()
      .pipe(finalize(() => this.isLoadingCategories.set(false)))
      .subscribe({
        next: (response) => {
          this.categories.set(response.data ?? []);
        },
        error: () => {
          this.categories.set([]);
        },
      });
  }
}
