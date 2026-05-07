import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FileSelectEvent, FileUploadModule } from 'primeng/fileupload';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectFilterEvent, MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';
import { Promotion } from '../../../core/models/promotion';
import { Product } from '../../../core/models/product';
import { ProductsService } from '../../../core/services/products.service';
import { PromotionsService } from '../../../core/services/promotions.service';
import { ToastService } from '../../../core/services/toast.service';

interface NewPromotionDialogData {
  promotion?: Promotion;
}

interface ProductOption {
  label: string;
  value: string;
  sku?: string;
}

type PromotionProductIdValue = string | null | undefined;
type PromotionProductSelection =
  | PromotionProductIdValue
  | { value?: PromotionProductIdValue; id?: PromotionProductIdValue };

const MAX_PRODUCTS_RESULTS = 50;

@Component({
  selector: 'app-new-promotion',
  imports: [
    ButtonModule,
    FileUploadModule,
    InputNumberModule,
    InputTextModule,
    MultiSelectModule,
    TextareaModule,
    ReactiveFormsModule,
  ],
  templateUrl: './new-promotion.html',
  styleUrl: './new-promotion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewPromotion implements OnInit, OnDestroy {
  private readonly productsService = inject(ProductsService);
  private readonly promotionsService = inject(PromotionsService);
  private readonly toastService = inject(ToastService);
  private readonly dialogRef = inject(DynamicDialogRef);
  private readonly dialogConfig = inject(DynamicDialogConfig<NewPromotionDialogData>);

  private readonly editingPromotion = signal<Promotion | null>(
    this.dialogConfig.data?.promotion ?? null,
  );
  private readonly selectedImageFile = signal<File | null>(null);
  private readonly selectedImageObjectUrl = signal<string | null>(null);
  protected readonly fallbackImage = 'assets/product-placeholder.jpg';

  protected readonly isSubmitting = signal(false);
  protected readonly isLoadingProducts = signal(false);
  protected readonly productOptions = signal<ProductOption[]>([]);
  protected readonly loadedProductsCount = signal(0);
  protected readonly hasSelectedNewImage = computed(() => this.selectedImageFile() !== null);
  protected readonly selectedProductsCountLabel = computed(() => {
    const count = uniqueIds(this.form.controls.idsProds.value).length;
    return count === 1 ? '1 producto seleccionado' : `${count} productos seleccionados`;
  });
  protected readonly currentImageUrl = computed(() => {
    const selectedPreview = this.selectedImageObjectUrl();
    if (selectedPreview) {
      return selectedPreview;
    }

    const currentImage = this.form.controls.file.value.trim();
    return currentImage || null;
  });
  protected readonly isEditMode = computed(() => this.editingPromotion() !== null);
  protected readonly modalTitle = computed(() =>
    this.isEditMode() ? 'Editar promoción' : 'Nueva promoción',
  );
  protected readonly submitLabel = computed(() => (this.isEditMode() ? 'Actualizar' : 'Crear'));

  protected readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(500)],
    }),
    percent: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0), Validators.max(100)],
    }),
    allProducts: new FormControl(false, { nonNullable: true }),
    idsProds: new FormControl<PromotionProductSelection[]>([], { nonNullable: true }),
    file: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.patchFormIfEditing();
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.revokeObjectUrl();
  }

  protected loadProductsOnPanelShow(): void {
    if (this.productOptions().length) {
      return;
    }

    this.loadProducts();
  }

  protected onProductsFilter(event: MultiSelectFilterEvent): void {
    this.loadProducts(event.filter ?? '');
  }

  protected setProductsMode(allProducts: boolean): void {
    this.form.controls.allProducts.setValue(allProducts);

    if (allProducts) {
      this.form.controls.idsProds.setValue([]);
    }

    this.form.controls.idsProds.markAsTouched();
    this.form.updateValueAndValidity();
  }

  protected onImageSelect(event: FileSelectEvent): void {
    const file = event.files[0] ?? null;
    this.selectedImageFile.set(file);

    this.revokeObjectUrl();

    if (file) {
      this.selectedImageObjectUrl.set(URL.createObjectURL(file));
    }
  }

  protected clearImageSelection(): void {
    this.selectedImageFile.set(null);
    this.revokeObjectUrl();
  }

  protected onPreviewError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.src = this.fallbackImage;
  }

  protected cancel(): void {
    this.dialogRef.close({ saved: false });
  }

  protected savePromotion(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const promotionFormData = this.buildFormData();
    const request$ = this.isEditMode()
      ? this.promotionsService.updatePromotion(promotionFormData, this.editingPromotion()!.id)
      : this.promotionsService.createPromotion(promotionFormData);

    request$.pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
      next: () => {
        this.toastService.setMessage({
          severity: 'success',
          summary: this.isEditMode() ? 'Promoción actualizada' : 'Promoción creada',
          detail: this.isEditMode()
            ? 'Los datos de la promoción se actualizaron correctamente.'
            : 'La nueva promoción se registró correctamente.',
        });

        this.dialogRef.close({ saved: true });
      },
      error: (error: unknown) => {
        const detail =
          typeof error === 'string'
            ? error
            : 'No se pudo guardar la promoción. Intenta nuevamente.';

        this.toastService.setMessage({
          severity: 'error',
          summary: 'Error al guardar',
          detail,
        });
      },
    });
  }

  protected isControlInvalid(
    controlName: 'title' | 'description' | 'percent' | 'idsProds',
  ): boolean {
    if (controlName === 'idsProds') {
      return this.form.hasError('productsRequired') && this.form.touched;
    }

    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  private patchFormIfEditing(): void {
    const promotion = this.editingPromotion();

    if (!promotion) {
      return;
    }

    this.form.patchValue({
      title: promotion.title,
      allProducts: normalizeIdsProds(promotion.idsProds).length === 0,
      description: promotion.description,
      percent: promotion.percent,
      idsProds: uniqueIds(normalizeIdsProds(promotion.idsProds)),
      file: promotion.file ?? '',
    });

    this.productOptions.set(buildFallbackOptions(this.form.controls.idsProds.value));
  }

  private buildFormData(): FormData {
    const rawValue = this.form.getRawValue();
    const formData = new FormData();
    const normalizedProductIds = rawValue.allProducts ? [] : uniqueIds(rawValue.idsProds);

    formData.append('title', rawValue.title.trim());
    formData.append('description', rawValue.description.trim());
    formData.append('percent', String(rawValue.percent ?? 0));
    formData.append('idsProds', JSON.stringify(normalizedProductIds));

    const file = this.selectedImageFile();
    if (file) {
      formData.append('file', file);
    }

    return formData;
  }

  private revokeObjectUrl(): void {
    const objectUrl = this.selectedImageObjectUrl();

    if (!objectUrl) {
      return;
    }

    URL.revokeObjectURL(objectUrl);
    this.selectedImageObjectUrl.set(null);
  }

  private loadProducts(search = ''): void {
    this.isLoadingProducts.set(true);

    this.productsService
      .getProducts({
        page: 1,
        limit: MAX_PRODUCTS_RESULTS,
        search: search.trim() || undefined,
      })
      .pipe(finalize(() => this.isLoadingProducts.set(false)))
      .subscribe({
        next: (response) => {
          this.loadedProductsCount.set(response.data.length);
          this.productOptions.set(
            mergeProductOptions(
              response.data.map(mapProductToOption),
              this.form.controls.idsProds.value,
            ),
          );
        },
        error: () => {
          this.toastService.setMessage({
            severity: 'warn',
            summary: 'Productos no disponibles',
            detail: 'No se pudieron cargar los productos para la promoción.',
          });
        },
      });
  }
}

function mapProductToOption(product: Product): ProductOption {
  return {
    label: product.name,
    value: String(product.id).trim(),
    sku: product.sku,
  };
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

function buildFallbackOptions(ids: readonly PromotionProductSelection[]): ProductOption[] {
  return uniqueIds(ids).map((id) => ({
    label: `Producto #${id}`,
    value: id,
    sku: 'Sin cargar',
  }));
}

function mergeProductOptions(
  options: ProductOption[],
  selectedIds: readonly PromotionProductSelection[],
): ProductOption[] {
  const merged = new Map<string, ProductOption>();

  for (const option of buildFallbackOptions(selectedIds)) {
    merged.set(option.value, option);
  }

  for (const option of options) {
    merged.set(option.value, option);
  }

  return Array.from(merged.values());
}

function promotionProductsValidator(control: AbstractControl): { productsRequired: true } | null {
  const formGroup = control as FormGroup;
  const allProducts = formGroup.controls['allProducts']?.value;
  const idsProds = formGroup.controls['idsProds']?.value ?? [];

  if (allProducts || uniqueIds(idsProds).length > 0) {
    return null;
  }

  return { productsRequired: true };
}

function uniqueIds(values: readonly PromotionProductSelection[]): string[] {
  return Array.from(
    new Set(
      values
        .map(normalizeProductSelectionId)
        .filter(Boolean),
    ),
  );
}

function normalizeProductSelectionId(value: PromotionProductSelection): string {
  if (typeof value === 'object' && value !== null) {
    if ('value' in value) {
      return normalizeProductSelectionId(value.value);
    }

    if ('id' in value) {
      return normalizeProductSelectionId(value.id);
    }
  }

  return typeof value === 'string' ? value.trim() : '';
}
