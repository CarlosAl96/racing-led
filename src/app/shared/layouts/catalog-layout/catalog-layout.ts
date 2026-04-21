import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Header } from '../../components/header/header';
import { Footer } from '../../components/footer/footer';
import { RouterOutlet } from '@angular/router';
import { ShoppingCart } from '../../../catalog/shopping-cart/shopping-cart';
import { ButtonModule } from 'primeng/button';
import { QuoteCartService } from '../../../core/services/quote-cart.service';

@Component({
  selector: 'app-catalog-layout',
  imports: [Header, RouterOutlet, Footer, ShoppingCart, ButtonModule],
  templateUrl: './catalog-layout.html',
  styleUrl: './catalog-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogLayout implements AfterViewInit, OnDestroy {
  private readonly quoteCartService = inject(QuoteCartService);
  private readonly pulseDurationMs = 1200;
  private resizeObserver?: ResizeObserver;
  private hasSeenPulse = false;

  @ViewChild('headerHost', { static: true })
  private headerHost?: ElementRef<HTMLElement>;

  protected readonly headerHeight = signal(0);
  protected readonly isFabPulsing = signal(false);

  constructor() {
    effect((onCleanup) => {
      this.quoteCartService.addPulse();

      if (!this.hasSeenPulse) {
        this.hasSeenPulse = true;
        return;
      }

      this.isFabPulsing.set(true);

      if (typeof window === 'undefined') {
        return;
      }

      const pulseTimeout = window.setTimeout(() => {
        this.isFabPulsing.set(false);
      }, this.pulseDurationMs);

      onCleanup(() => window.clearTimeout(pulseTimeout));
    });
  }

  ngAfterViewInit(): void {
    this.syncHeaderHeight();

    const headerElement = this.headerHost?.nativeElement;
    if (!headerElement || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => this.syncHeaderHeight());
    this.resizeObserver.observe(headerElement);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private syncHeaderHeight(): void {
    const headerElement = this.headerHost?.nativeElement;
    this.headerHeight.set(headerElement?.getBoundingClientRect().height ?? 0);
  }
}
