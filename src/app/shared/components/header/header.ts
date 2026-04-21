import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CatalogFiltersService } from '../../../core/services/catalog-filters.service';
import { QuoteCartService } from '../../../core/services/quote-cart.service';

@Component({
  selector: 'app-header',
  imports: [ButtonModule, BadgeModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header implements OnInit, OnDestroy {
  private readonly quoteCartService = inject(QuoteCartService);
  private readonly catalogFiltersService = inject(CatalogFiltersService);
  private readonly desktopBreakpoint = 992;
  private readonly pulseDurationMs = 1200;
  private readonly resizeHandler = () => this.syncViewportMode();
  private hasSeenPulse = false;

  readonly brandTitle = 'RACING LED';
  protected readonly isMobile = signal(false);
  protected readonly cartCount = this.quoteCartService.totalQuantity;
  protected readonly isCatalogFilterToggleVisible = this.catalogFiltersService.isToggleVisible;
  protected readonly isCatalogFiltersOpen = this.catalogFiltersService.isFiltersOpen;
  protected readonly isCartPulsing = signal(false);
  protected readonly isCartOpen = computed(() =>
    this.isMobile() ? this.quoteCartService.isMobileOpen() : this.quoteCartService.isDesktopOpen(),
  );

  constructor() {
    effect((onCleanup) => {
      this.quoteCartService.addPulse();

      if (!this.hasSeenPulse) {
        this.hasSeenPulse = true;
        return;
      }

      this.isCartPulsing.set(true);

      if (typeof window === 'undefined') {
        return;
      }

      const pulseTimeout = window.setTimeout(() => {
        this.isCartPulsing.set(false);
      }, this.pulseDurationMs);

      onCleanup(() => window.clearTimeout(pulseTimeout));
    });
  }

  ngOnInit(): void {
    this.syncViewportMode();

    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('resize', this.resizeHandler, { passive: true });
  }

  ngOnDestroy(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('resize', this.resizeHandler);
  }

  protected toggleCart(): void {
    if (this.isMobile()) {
      this.quoteCartService.toggleMobile();
      return;
    }

    this.quoteCartService.toggleDesktop();
  }

  protected toggleCatalogFilters(): void {
    this.catalogFiltersService.toggleFilters();
  }

  private syncViewportMode(): void {
    if (typeof window === 'undefined') {
      this.isMobile.set(false);
      return;
    }

    this.isMobile.set(window.innerWidth < this.desktopBreakpoint);
  }
}
