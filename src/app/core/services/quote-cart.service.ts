import { Injectable, computed, signal } from '@angular/core';
import { QuoteCartItem } from '../models/quote-cart-item';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root',
})
export class QuoteCartService {
  readonly items = signal<QuoteCartItem[]>([]);
  readonly isDesktopOpen = signal(false);
  readonly isMobileOpen = signal(false);
  readonly hasItems = computed(() => this.items().length > 0);
  readonly totalQuantity = computed(() =>
    this.items().reduce((total, item) => total + item.quantity, 0),
  );
  readonly totalAmountUsd = computed(() =>
    this.items().reduce((total, item) => total + item.product.price * item.quantity, 0),
  );

  addProduct(product: Product): void {
    const existingItem = this.items().find((item) => item.product.id === product.id);

    if (existingItem) {
      this.setItemQuantity(product.id, existingItem.quantity + 1);
      return;
    }

    this.items.update((items) => [...items, { product, quantity: 1 }]);
  }

  incrementQuantity(productId: number): void {
    const item = this.items().find((currentItem) => currentItem.product.id === productId);

    if (!item) {
      return;
    }

    this.setItemQuantity(productId, item.quantity + 1);
  }

  decrementQuantity(productId: number): void {
    const item = this.items().find((currentItem) => currentItem.product.id === productId);

    if (!item) {
      return;
    }

    this.setItemQuantity(productId, item.quantity - 1);
  }

  removeProduct(productId: number): void {
    this.items.update((items) => items.filter((item) => item.product.id !== productId));
    this.syncVisibilityWithItems();
  }

  clear(): void {
    this.items.set([]);
    this.closeAll();
  }

  openDesktop(): void {
    if (!this.hasItems()) {
      return;
    }

    this.isDesktopOpen.set(true);
  }

  closeDesktop(): void {
    this.isDesktopOpen.set(false);
  }

  toggleDesktop(): void {
    if (!this.hasItems()) {
      return;
    }

    this.isDesktopOpen.update((isOpen) => !isOpen);
  }

  setMobileOpen(isOpen: boolean): void {
    if (!this.hasItems() && isOpen) {
      return;
    }

    this.isMobileOpen.set(isOpen);
  }

  closeMobile(): void {
    this.isMobileOpen.set(false);
  }

  toggleMobile(): void {
    if (!this.hasItems()) {
      return;
    }

    this.isMobileOpen.update((isOpen) => !isOpen);
  }

  private setItemQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeProduct(productId);
      return;
    }

    this.items.update((items) =>
      items.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
            }
          : item,
      ),
    );
  }

  private syncVisibilityWithItems(): void {
    if (this.hasItems()) {
      return;
    }

    this.closeAll();
  }

  private closeAll(): void {
    this.isDesktopOpen.set(false);
    this.isMobileOpen.set(false);
  }
}