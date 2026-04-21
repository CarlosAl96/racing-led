import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CatalogFiltersService {
  readonly isToggleVisible = signal(false);
  readonly isFiltersOpen = signal(false);

  showToggle(): void {
    this.isToggleVisible.set(true);
  }

  hideToggle(): void {
    this.isToggleVisible.set(false);
    this.isFiltersOpen.set(false);
  }

  toggleFilters(): void {
    if (!this.isToggleVisible()) {
      return;
    }

    this.isFiltersOpen.update((isOpen) => !isOpen);
  }
}
