import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { Promotion } from '../../core/models/promotion';
import { PromotionsService } from '../../core/services/promotions.service';
import { ToastService } from '../../core/services/toast.service';
import { NewPromotion } from './new-promotion/new-promotion';

interface PromotionsTablePageEvent {
  first?: number | null;
  rows?: number | null;
}

@Component({
  selector: 'app-promotions',
  imports: [
    ButtonModule,
    ConfirmDialogModule,
    DatePipe,
    DynamicDialogModule,
    InputTextModule,
    ReactiveFormsModule,
    TableModule,
  ],
  providers: [ConfirmationService, DialogService],
  templateUrl: './promotions.html',
  styleUrl: './promotions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Promotions implements OnInit, OnDestroy {
  private readonly promotionsService = inject(PromotionsService);
  private readonly toastService = inject(ToastService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly dialogService = inject(DialogService);
  private promotionsRequestSubscription?: Subscription;
  private dialogCloseSubscription?: Subscription;
  private dialogRef: DynamicDialogRef | null = null;

  protected readonly rows = 20;
  protected readonly fallbackImage = 'assets/product-placeholder.jpg';
  protected readonly currentPageReportTemplate =
    'Mostrando {first} a {last} de {totalRecords} promociones';
  protected readonly filtersForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
  });
  protected readonly promotions = signal<Promotion[]>([]);
  protected readonly totalRecords = signal(0);
  protected readonly isLoading = signal(false);
  protected readonly deletingPromotionId = signal<number | null>(null);
  protected readonly first = signal(0);
  protected readonly appliedSearch = signal('');
  protected readonly hasPromotions = computed(() => this.promotions().length > 0);
  protected readonly hasActiveFilters = computed(() => !!this.appliedSearch());

  ngOnInit(): void {
    this.loadPromotions(1);
  }

  ngOnDestroy(): void {
    this.promotionsRequestSubscription?.unsubscribe();
    this.dialogCloseSubscription?.unsubscribe();
    this.dialogRef?.close();
  }

  protected openPromotionModal(promotion?: Promotion): void {
    this.dialogCloseSubscription?.unsubscribe();

    this.dialogRef = this.dialogService.open(NewPromotion, {
      header: promotion ? 'Editar promoción' : 'Agregar promoción',
      modal: true,
      width: 'min(92vw, 44rem)',
      dismissableMask: true,
      closable: true,
      data: { promotion },
    });

    if (!this.dialogRef) {
      return;
    }

    this.dialogCloseSubscription = this.dialogRef.onClose.subscribe((result?: { saved?: boolean }) => {
      if (!result?.saved) {
        return;
      }

      this.loadPromotions(this.getCurrentPage());
    });
  }

  protected applyFilters(): void {
    this.appliedSearch.set(this.filtersForm.controls.search.value.trim());
    this.first.set(0);
    this.loadPromotions(1);
  }

  protected clearFilters(): void {
    this.filtersForm.setValue({ search: '' });
    this.appliedSearch.set('');
    this.first.set(0);
    this.loadPromotions(1);
  }

  protected onLazyLoad(event: PromotionsTablePageEvent): void {
    const nextFirst = event.first ?? 0;

    if (nextFirst === this.first()) {
      return;
    }

    this.first.set(nextFirst);
    this.loadPromotions(this.getCurrentPage());
  }

  protected resolveImage(urlImage?: string | null): string {
    if (!urlImage?.trim()) {
      return this.fallbackImage;
    }

    return urlImage;
  }

  protected onImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.src = this.fallbackImage;
  }

  protected resolveIdsProds(idsProds: Promotion['idsProds']): string {
    const normalized = normalizeIdsProds(idsProds);
    return normalized.length ? normalized.join(', ') : 'Sin productos vinculados';
  }

  protected resolveProductsCount(idsProds: Promotion['idsProds']): number {
    return normalizeIdsProds(idsProds).length;
  }

  protected confirmDeletePromotion(promotion: Promotion): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Seguro que deseas eliminar la promoción ${promotion.title}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deletePromotion(promotion);
      },
    });
  }

  private loadPromotions(page: number): void {
    this.promotionsRequestSubscription?.unsubscribe();
    this.isLoading.set(true);

    this.promotionsRequestSubscription = this.promotionsService
      .getPromotions({
        page,
        limit: this.rows,
        search: this.appliedSearch() || undefined,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.promotions.set(response.data);
          this.totalRecords.set(response.pagination.total_records);
          this.first.set((response.pagination.current_page - 1) * response.pagination.limit);
        },
        error: () => {
          this.promotions.set([]);
          this.totalRecords.set(0);
          this.first.set(0);
        },
      });
  }

  private deletePromotion(promotion: Promotion): void {
    this.deletingPromotionId.set(promotion.id);

    this.promotionsService
      .deletePromotion(promotion.id)
      .pipe(finalize(() => this.deletingPromotionId.set(null)))
      .subscribe({
        next: () => {
          this.toastService.setMessage({
            severity: 'success',
            summary: 'Promoción eliminada',
            detail: 'La promoción se eliminó correctamente.',
          });
          this.loadPromotions(this.getCurrentPage());
        },
        error: (error: unknown) => {
          const detail =
            typeof error === 'string'
              ? error
              : 'No se pudo eliminar la promoción. Intenta nuevamente.';

          this.toastService.setMessage({
            severity: 'error',
            summary: 'Error al eliminar',
            detail,
          });
        },
      });
  }

  private getCurrentPage(): number {
    return Math.floor(this.first() / this.rows) + 1;
  }
}

function normalizeIdsProds(idsProds: Promotion['idsProds']): string[] {
  if (Array.isArray(idsProds)) {
    return idsProds.map((value) => String(value).trim()).filter(Boolean);
  }

  if (typeof idsProds === 'string') {
    return idsProds
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return [];
}
