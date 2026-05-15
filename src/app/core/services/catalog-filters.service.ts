import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { ProductsService } from './products.service';

type CatalogFiltersAction = {
  type: 'idle' | 'apply' | 'clear';
  revision: number;
};

@Injectable({
  providedIn: 'root',
})
export class CatalogFiltersService {
  private readonly productsService = inject(ProductsService);

  readonly isToggleVisible = signal(false);
  readonly isFiltersOpen = signal(false);
  readonly categories = signal<string[]>([]);
  readonly isLoadingCategories = signal(false);
  readonly draftSearch = signal('');
  readonly appliedSearch = signal('');
  readonly appliedCategory = signal('');
  readonly action = signal<CatalogFiltersAction>({ type: 'idle', revision: 0 });

  showToggle(): void {
    this.isToggleVisible.set(true);
    this.ensureCategoriesLoaded();
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

  setFiltersOpen(isOpen: boolean): void {
    this.isFiltersOpen.set(isOpen);
  }

  setDraftSearch(search: string): void {
    this.draftSearch.set(search);
  }

  applyFilters(filters?: { search?: string; category?: string }): void {
    const nextSearch = (filters?.search ?? this.draftSearch()).trim();
    const nextCategory = (filters?.category ?? this.appliedCategory()).trim();

    this.draftSearch.set(nextSearch);
    this.appliedSearch.set(nextSearch);
    this.appliedCategory.set(nextCategory);
    this.action.update((current) => ({ type: 'apply', revision: current.revision + 1 }));
  }

  clearFilters(): void {
    this.draftSearch.set('');
    this.appliedSearch.set('');
    this.appliedCategory.set('');
    this.action.update((current) => ({ type: 'clear', revision: current.revision + 1 }));
  }

  private ensureCategoriesLoaded(): void {
    if (this.categories().length > 0 || this.isLoadingCategories()) {
      return;
    }

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
