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
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CatalogFiltersService } from '../../../core/services/catalog-filters.service';
import { QuoteCartService } from '../../../core/services/quote-cart.service';

@Component({
  selector: 'app-header',
  imports: [
    ButtonModule,
    BadgeModule,
    DrawerModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule,
    ReactiveFormsModule,
    SelectModule,
  ],
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
  protected readonly filtersForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    category: new FormControl('', { nonNullable: true }),
  });
  protected readonly cartCount = this.quoteCartService.totalQuantity;
  protected readonly isCatalogFilterToggleVisible = this.catalogFiltersService.isToggleVisible;
  protected readonly isCatalogFiltersOpen = this.catalogFiltersService.isFiltersOpen;
  protected readonly appliedSearch = this.catalogFiltersService.appliedSearch;
  protected readonly appliedCategory = this.catalogFiltersService.appliedCategory;
  protected readonly categories = this.catalogFiltersService.categories;
  protected readonly isLoadingCategories = this.catalogFiltersService.isLoadingCategories;
  protected readonly isCartPulsing = signal(false);
  protected readonly isCartOpen = computed(() =>
    this.isMobile() ? this.quoteCartService.isMobileOpen() : this.quoteCartService.isDesktopOpen(),
  );
  protected readonly isMobileFiltersDrawerVisible = computed(
    () => this.isMobile() && this.isCatalogFilterToggleVisible() && this.isCatalogFiltersOpen(),
  );
  protected readonly categoryOptions = computed(() => [
    { label: 'Todas las categorías', value: '' },
    ...this.categories().map((category) => ({
      label: category,
      value: category,
    })),
  ]);
  protected readonly hasActiveHeaderFilters = computed(
    () => !!this.appliedSearch() || !!this.appliedCategory(),
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
    this.filtersForm.setValue({
      search: this.appliedSearch(),
      category: this.appliedCategory(),
    });

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

  protected applyHeaderFilters(): void {
    this.catalogFiltersService.applyFilters({
      search: this.filtersForm.controls.search.value,
      category: this.filtersForm.controls.category.value,
    });
  }

  protected closeMobileFilters(): void {
    this.catalogFiltersService.setFiltersOpen(false);
  }

  protected onMobileFiltersVisibilityChange(isOpen: boolean): void {
    this.catalogFiltersService.setFiltersOpen(isOpen);
  }

  protected applyCategory(category: string): void {
    this.filtersForm.controls.category.setValue(category);
    this.catalogFiltersService.applyFilters({
      search: this.filtersForm.controls.search.value,
      category,
    });
    this.catalogFiltersService.setFiltersOpen(false);
  }

  protected clearHeaderFilters(): void {
    this.filtersForm.setValue({
      search: '',
      category: '',
    });
    this.catalogFiltersService.clearFilters();
    this.catalogFiltersService.setFiltersOpen(false);
  }

  protected isAppliedCategory(category: string): boolean {
    return this.appliedCategory() === category;
  }

  private syncViewportMode(): void {
    if (typeof window === 'undefined') {
      this.isMobile.set(false);
      return;
    }

    this.isMobile.set(window.innerWidth < this.desktopBreakpoint);
  }
}
