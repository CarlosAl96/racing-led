import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { DrawerModule } from 'primeng/drawer';
import { DolarAPIService } from '../../core/services/dolar-api.service';
import { QuoteCartService } from '../../core/services/quote-cart.service';

@Component({
  selector: 'app-shopping-cart',
  imports: [ButtonModule, DecimalPipe, DividerModule, DrawerModule, NgTemplateOutlet],
  templateUrl: './shopping-cart.html',
  styleUrl: './shopping-cart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShoppingCart implements OnInit {
  private readonly quoteCartService = inject(QuoteCartService);
  private readonly dolarApiService = inject(DolarAPIService);

  readonly mode = input<'desktop' | 'mobile'>('desktop');
  readonly headerOffset = input(0);
  protected readonly fallbackImage = 'assets/product-placeholder.jpg';
  protected readonly exchangeRate = signal<number | null>(null);
  protected readonly items = this.quoteCartService.items;
  protected readonly hasItems = this.quoteCartService.hasItems;
  protected readonly totalQuantity = this.quoteCartService.totalQuantity;
  protected readonly totalAmountUsd = this.quoteCartService.totalAmountUsd;
  protected readonly isVisible = computed(() =>
    this.mode() === 'desktop'
      ? this.hasItems() && this.quoteCartService.isDesktopOpen()
      : this.hasItems() && this.quoteCartService.isMobileOpen(),
  );
  protected readonly totalAmountBs = computed(() => {
    const rate = this.exchangeRate();
    return rate === null ? null : this.totalAmountUsd() * rate;
  });
  protected readonly drawerStyle = computed(() => {
    const offset = Math.max(this.headerOffset(), 0);

    return {
      height: `calc(100dvh - ${offset}px)`,
      'max-height': `calc(100dvh - ${offset}px)`,
      width: 'min(100vw, 28rem)',
    };
  });
  protected readonly drawerMaskStyle = computed(() => {
    const offset = Math.max(this.headerOffset(), 0);

    return {
      top: `${offset}px`,
      height: `calc(100dvh - ${offset}px)`,
    };
  });

  ngOnInit(): void {
    this.loadExchangeRate();
  }

  protected closeCart(): void {
    if (this.mode() === 'desktop') {
      this.quoteCartService.closeDesktop();
      return;
    }

    this.quoteCartService.closeMobile();
  }

  protected onMobileVisibilityChange(isOpen: boolean): void {
    this.quoteCartService.setMobileOpen(isOpen);
  }

  protected incrementQuantity(productId: number): void {
    this.quoteCartService.incrementQuantity(productId);
  }

  protected decrementQuantity(productId: number): void {
    this.quoteCartService.decrementQuantity(productId);
  }

  protected removeProduct(productId: number): void {
    this.quoteCartService.removeProduct(productId);
  }

  protected clearCart(): void {
    this.quoteCartService.clear();
  }

  protected resolveLineTotalUsd(priceUsd: number, quantity: number): number {
    return priceUsd * quantity;
  }

  protected resolveLineTotalBs(priceUsd: number, quantity: number): number | null {
    const rate = this.exchangeRate();
    return rate === null ? null : priceUsd * quantity * rate;
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
}
