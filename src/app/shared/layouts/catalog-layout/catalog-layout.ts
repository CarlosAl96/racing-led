import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  signal,
} from '@angular/core';
import { Header } from '../../components/header/header';
import { Footer } from '../../components/footer/footer';
import { RouterOutlet } from '@angular/router';
import { ShoppingCart } from '../../../catalog/shopping-cart/shopping-cart';

@Component({
  selector: 'app-catalog-layout',
  imports: [Header, RouterOutlet, Footer, ShoppingCart],
  templateUrl: './catalog-layout.html',
  styleUrl: './catalog-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogLayout implements AfterViewInit, OnDestroy {
  private resizeObserver?: ResizeObserver;

  @ViewChild('headerHost', { static: true })
  private headerHost?: ElementRef<HTMLElement>;

  protected readonly headerHeight = signal(0);

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
