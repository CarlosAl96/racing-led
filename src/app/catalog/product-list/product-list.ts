import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';
import { Product } from '../../core/models/product';
import { DolarAPIService } from '../../core/services/dolar-api.service';
import { ProductsService } from '../../core/services/products.service';

@Component({
  selector: 'app-product-list',
  imports: [ButtonModule, DecimalPipe],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductList implements OnInit, AfterViewInit, OnDestroy {
  private readonly productsService = inject(ProductsService);
  private readonly dolarApiService = inject(DolarAPIService);
  private readonly previewAnimationMs = 260;
  private observer?: IntersectionObserver;
  private closePreviewTimeout?: number;

  @ViewChild('infiniteTrigger', { static: true })
  private infiniteTrigger?: ElementRef<HTMLDivElement>;

  protected readonly rows = 20;
  protected readonly fallbackImage = 'assets/product-placeholder.jpg';
  protected readonly products = signal<Product[]>([]);
  protected readonly totalRecords = signal(0);
  protected readonly isLoading = signal(false);
  protected readonly isLoadingMore = signal(false);
  protected readonly hasMore = signal(true);
  protected readonly nextPage = signal(1);
  protected readonly exchangeRate = signal<number | null>(null);
  protected readonly previewImageUrl = signal<string | null>(null);
  protected readonly previewImageName = signal<string>('');
  protected readonly isPreviewOpen = signal(false);
  protected readonly hasProducts = computed(() => this.products().length > 0);

  ngOnInit(): void {
    this.loadExchangeRate();
    this.loadNextPage();
  }

  ngAfterViewInit(): void {
    if (!this.infiniteTrigger) {
      return;
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

    this.observer.observe(this.infiniteTrigger.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();

    if (this.closePreviewTimeout) {
      window.clearTimeout(this.closePreviewTimeout);
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

  protected resolvePriceBs(priceUsd: number): number | null {
    const rate = this.exchangeRate();
    return rate === null ? null : priceUsd * rate;
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

    this.productsService
      .getProducts({
        page: pageToLoad,
        limit: this.rows,
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
}
