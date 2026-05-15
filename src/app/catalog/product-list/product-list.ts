import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Carousel, CarouselModule } from 'primeng/carousel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { finalize, Subscription } from 'rxjs';
import {
  Product,
  hasProductDiscount,
  resolveProductDiscountedPriceUsd,
  resolveProductDiscountPercent,
} from '../../core/models/product';
import { Promotion } from '../../core/models/promotion';
import { DolarAPIService } from '../../core/services/dolar-api.service';
import { ProductsService } from '../../core/services/products.service';
import { QuoteCartService } from '../../core/services/quote-cart.service';
import { CatalogFiltersService } from '../../core/services/catalog-filters.service';
import { PromotionsService } from '../../core/services/promotions.service';
import { ShoppingCart } from '../shopping-cart/shopping-cart';

interface CategoryOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-product-list',
  imports: [
    ButtonModule,
    CarouselModule,
    DecimalPipe,
    NgOptimizedImage,
    InputTextModule,
    ReactiveFormsModule,
    SelectModule,
    ShoppingCart,
  ],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductList implements OnInit, OnDestroy {
  private readonly productsService = inject(ProductsService);
  private readonly promotionsService = inject(PromotionsService);
  private readonly dolarApiService = inject(DolarAPIService);
  private readonly quoteCartService = inject(QuoteCartService);
  private readonly catalogFiltersService = inject(CatalogFiltersService);
  private readonly previewAnimationMs = 260;
  private readonly desktopBreakpoint = 992;
  private readonly promotionsLimit = 500;
  private readonly resizeHandler = () => this.syncViewportMode();
  private observer?: IntersectionObserver;
  private closePreviewTimeout?: number;
  private productsRequestSubscription?: Subscription;
  private promotionsRequestSubscription?: Subscription;
  private lastHandledFiltersRevision = 0;

  @ViewChild('infiniteTrigger')
  private set infiniteTrigger(element: ElementRef<HTMLDivElement> | undefined) {
    const trigger = element?.nativeElement;

    if (!trigger) {
      return;
    }

    const observer = this.getObserver();

    if (!observer) {
      return;
    }

    observer.disconnect();
    observer.observe(trigger);
  }

  protected readonly rows = 20;
  protected readonly fallbackImage = 'assets/product-placeholder.jpg';
  protected readonly filtersForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    category: new FormControl('', { nonNullable: true }),
  });
  protected readonly products = signal<Product[]>([]);
  protected readonly promotions = signal<Promotion[]>([]);
  protected readonly categories = this.catalogFiltersService.categories;
  protected readonly totalRecords = signal(0);
  protected readonly isLoading = signal(false);
  protected readonly isLoadingMore = signal(false);
  protected readonly isLoadingPromotions = signal(false);
  protected readonly isLoadingCategories = this.catalogFiltersService.isLoadingCategories;
  protected readonly hasMore = signal(true);
  protected readonly nextPage = signal(1);
  protected readonly exchangeRate = signal<number | null>(null);
  protected readonly appliedSearch = this.catalogFiltersService.appliedSearch;
  protected readonly appliedCategory = this.catalogFiltersService.appliedCategory;
  protected readonly appliedForDiscounts = signal(false);
  protected readonly selectedPromotionId = signal<string | number | null>(null);
  protected readonly previewImageUrl = signal<string | null>(null);
  protected readonly previewImageName = signal<string>('');
  protected readonly isPreviewOpen = signal(false);
  protected readonly isMobile = signal(false);
  protected readonly hasProducts = computed(() => this.products().length > 0);
  protected readonly hasPromotions = computed(() => this.promotions().length > 0);
  protected readonly isFiltersOpen = this.catalogFiltersService.isFiltersOpen;
  protected readonly showDesktopFilters = computed(() => !this.isMobile() && this.isFiltersOpen());
  protected readonly hasActiveFilters = computed(
    () =>
      !!this.appliedSearch() ||
      !!this.appliedCategory() ||
      this.appliedForDiscounts() ||
      this.selectedPromotionId() !== null,
  );
  protected readonly selectedPromotion = computed(
    () => this.promotions().find((promotion) => promotion.id === this.selectedPromotionId()) ?? null,
  );
  protected readonly promotionCarouselResponsiveOptions = [
    {
      breakpoint: '1500px',
      numVisible: 3,
      numScroll: 1,
    },
    {
      breakpoint: '1200px',
      numVisible: 3,
      numScroll: 1,
    },
    {
      breakpoint: '820px',
      numVisible: 2,
      numScroll: 1,
    },
    {
      breakpoint: '560px',
      numVisible: 1,
      numScroll: 1,
    },
  ];
  protected readonly categoryOptions = computed<CategoryOption[]>(() => [
    { label: 'Todas las categorías', value: '' },
    ...this.categories().map((category) => ({
      label: category,
      value: category,
    })),
  ]);

  constructor() {
    effect(() => {
      const filtersAction = this.catalogFiltersService.action();

      if (filtersAction.revision === 0 || filtersAction.revision === this.lastHandledFiltersRevision) {
        return;
      }

      this.lastHandledFiltersRevision = filtersAction.revision;
      this.filtersForm.setValue({
        search: this.catalogFiltersService.draftSearch(),
        category: this.appliedCategory(),
      });

      if (filtersAction.type === 'clear') {
        this.appliedForDiscounts.set(false);
        this.selectedPromotionId.set(null);
      }

      this.resetProductsAndReload();
    });

    Carousel.prototype.onTouchMove = () => {};
  }

  ngOnInit(): void {
    this.catalogFiltersService.showToggle();
    this.syncViewportMode();
    this.filtersForm.setValue({
      search: this.catalogFiltersService.draftSearch(),
      category: this.appliedCategory(),
    });
    this.loadPromotions();
    this.loadExchangeRate();
    this.loadNextPage();

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.resizeHandler, { passive: true });
    }
  }
  ngOnDestroy(): void {
    this.catalogFiltersService.hideToggle();
    this.productsRequestSubscription?.unsubscribe();
    this.promotionsRequestSubscription?.unsubscribe();
    this.observer?.disconnect();

    if (this.closePreviewTimeout) {
      window.clearTimeout(this.closePreviewTimeout);
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  protected addToQuote(product: Product): void {
    this.quoteCartService.addProduct(product);

    if (!this.isMobile()) {
      this.quoteCartService.openDesktop();
    }
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

  protected promotionSummary(promotion: Promotion): string {
    const description = promotion.description.trim();

    if (description) {
      return description;
    }

    return `Hasta ${this.resolvePromotionPercent(promotion)}% de descuento`;
  }

  protected resolvePromotionImage(promotion: Promotion): string {
    return this.resolveImage(promotion.img ?? promotion.file ?? '');
  }

  protected resolvePromotionPercent(promotion: Promotion): string {
    const normalizedPercent = promotion.percent <= 1 ? promotion.percent * 100 : promotion.percent;

    if (Number.isInteger(normalizedPercent)) {
      return String(normalizedPercent);
    }

    return normalizedPercent.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
  }

  protected isPromotionSelected(promotion: Promotion): boolean {
    return this.selectedPromotionId() === promotion.id;
  }

  protected selectPromotion(promotion: Promotion): void {
    if (this.isPromotionSelected(promotion)) {
      return;
    }

    this.selectedPromotionId.set(promotion.id);
    this.appliedForDiscounts.set(false);
    this.resetProductsAndReload();
  }

  protected resolvePriceBs(priceUsd: number): number | null {
    const rate = this.exchangeRate();
    return rate === null ? null : priceUsd * rate;
  }

  protected hasDiscount(product: Product): boolean {
    return hasProductDiscount(product);
  }

  protected resolveDiscountPercent(product: Product): string {
    const discountPercent = resolveProductDiscountPercent(product);

    if (Number.isInteger(discountPercent)) {
      return String(discountPercent);
    }

    return discountPercent.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
  }

  protected resolveDiscountedPriceUsd(product: Product): number {
    return resolveProductDiscountedPriceUsd(product);
  }

  protected openImagePreview(imageUrl: string, imageName: string): void {
    if (this.closePreviewTimeout) {
      window.clearTimeout(this.closePreviewTimeout);
    }

    this.previewImageUrl.set(imageUrl);
    this.previewImageName.set(imageName);
    window.requestAnimationFrame(() => this.isPreviewOpen.set(true));
  }

  protected closeImagePreview(): void {
    this.isPreviewOpen.set(false);

    this.closePreviewTimeout = window.setTimeout(() => {
      this.previewImageUrl.set(null);
      this.previewImageName.set('');
    }, this.previewAnimationMs);
  }

  protected applyFilters(): void {
    this.catalogFiltersService.applyFilters({
      search: this.filtersForm.controls.search.value,
      category: this.filtersForm.controls.category.value,
    });
  }

  protected clearFilters(): void {
    this.filtersForm.setValue({
      search: '',
      category: '',
    });
    this.appliedForDiscounts.set(false);
    this.selectedPromotionId.set(null);
    this.catalogFiltersService.clearFilters();
  }

  protected showDiscountedProducts(): void {
    if (this.appliedForDiscounts()) {
      return;
    }

    this.selectedPromotionId.set(null);
    this.appliedForDiscounts.set(true);
    this.resetProductsAndReload();
  }

  protected showAllProducts(): void {
    if (!this.appliedForDiscounts() && this.selectedPromotionId() === null) {
      return;
    }

    this.selectedPromotionId.set(null);
    this.appliedForDiscounts.set(false);
    this.resetProductsAndReload();
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

  private loadNextPage(): void {
    if (!this.hasMore() || this.isLoading() || this.isLoadingMore()) {
      return;
    }

    const pageToLoad = this.nextPage();
    const isInitialPage = pageToLoad === 1;

    if (isInitialPage) {
      this.isLoading.set(true);
    } else {
      this.isLoadingMore.set(true);
    }

    this.productsRequestSubscription = this.productsService
      .getProducts({
        page: pageToLoad,
        limit: this.rows,
        search: this.appliedSearch() || undefined,
        category: this.appliedCategory() || undefined,
        idDiscounts: this.selectedPromotionId() !== null ? String(this.selectedPromotionId()) : undefined,
        forDiscounts: this.appliedForDiscounts() || undefined,
      })
      .pipe(
        finalize(() => {
          if (isInitialPage) {
            this.isLoading.set(false);
            return;
          }

          this.isLoadingMore.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          const mergedProducts =
            pageToLoad === 1 ? response.data : [...this.products(), ...response.data];

          this.products.set(mergedProducts);
          this.totalRecords.set(response.pagination.total_records);
          this.hasMore.set(response.pagination.next_page !== null);

          if (response.pagination.next_page !== null) {
            this.nextPage.set(response.pagination.next_page);
          }
        },
        error: () => {
          if (pageToLoad === 1) {
            this.products.set([]);
            this.totalRecords.set(0);
          }

          this.hasMore.set(false);
        },
      });
  }

  private loadPromotions(): void {
    this.isLoadingPromotions.set(true);
    this.promotionsRequestSubscription?.unsubscribe();

    this.promotionsRequestSubscription = this.promotionsService
      .getPromotions({
        page: 1,
        limit: this.promotionsLimit,
      })
      .pipe(finalize(() => this.isLoadingPromotions.set(false)))
      .subscribe({
        next: (response) => {
          this.promotions.set(response.data ?? []);
        },
        error: () => {
          this.promotions.set([]);
        },
      });
  }

  private resetProductsAndReload(): void {
    this.productsRequestSubscription?.unsubscribe();
    this.observer?.disconnect();
    this.products.set([]);
    this.totalRecords.set(0);
    this.hasMore.set(true);
    this.nextPage.set(1);
    this.isLoading.set(false);
    this.isLoadingMore.set(false);
    this.loadNextPage();
  }

  private getObserver(): IntersectionObserver | undefined {
    if (this.observer) {
      return this.observer;
    }

    if (typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          this.loadNextPage();
        }
      },
      {
        root: null,
        rootMargin: '320px 0px',
        threshold: 0.1,
      },
    );

    return this.observer;
  }

  private syncViewportMode(): void {
    if (typeof window === 'undefined') {
      this.isMobile.set(false);
      return;
    }

    const isMobileViewport = window.innerWidth < this.desktopBreakpoint;

    if (this.isMobile() !== isMobileViewport) {
      this.catalogFiltersService.setFiltersOpen(false);
    }

    this.isMobile.set(isMobileViewport);
  }
}
