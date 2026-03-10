import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
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
  private readonly desktopBreakpoint = 992;
  private readonly resizeHandler = () => this.syncViewportMode();

  readonly brandTitle = 'RACING LED';
  protected readonly isMobile = signal(false);
  protected readonly cartCount = this.quoteCartService.totalQuantity;
  protected readonly isCartOpen = computed(() =>
    this.isMobile() ? this.quoteCartService.isMobileOpen() : this.quoteCartService.isDesktopOpen(),
  );

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

  private syncViewportMode(): void {
    if (typeof window === 'undefined') {
      this.isMobile.set(false);
      return;
    }

    this.isMobile.set(window.innerWidth < this.desktopBreakpoint);
  }
}
