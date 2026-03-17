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
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Product } from '../../core/models/product';
import { DolarAPIService } from '../../core/services/dolar-api.service';
import { ProductsService } from '../../core/services/products.service';

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
    DatePipe,
    DecimalPipe,
    InputTextModule,
    ReactiveFormsModule,
    SelectModule,
    TableModule,
  ],
  templateUrl: './products.html',
  styleUrl: './products.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Products implements OnInit, OnDestroy {
  private readonly productsService = inject(ProductsService);
  private readonly dolarApiService = inject(DolarAPIService);
  private productsRequestSubscription?: Subscription;

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

  private loadExchangeRate(): void {
    this.dolarApiService.getOfficialRate().subscribe({
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
