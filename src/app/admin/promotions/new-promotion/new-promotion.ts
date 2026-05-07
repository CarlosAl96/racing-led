import {
  ChangeDetectionStrategy,
  Component,
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
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FileSelectEvent, FileUploadModule } from 'primeng/fileupload';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Promotion } from '../../../core/models/promotion';
import { PromotionsService } from '../../../core/services/promotions.service';
import { ToastService } from '../../../core/services/toast.service';

interface NewPromotionDialogData {
  promotion?: Promotion;
}

@Component({
  selector: 'app-new-promotion',
  imports: [
    ButtonModule,
    FileUploadModule,
    InputNumberModule,
    InputTextModule,
    TextareaModule,
    ReactiveFormsModule,
  ],
  templateUrl: './new-promotion.html',
  styleUrl: './new-promotion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewPromotion implements OnDestroy {
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
  protected readonly hasSelectedNewImage = computed(() => this.selectedImageFile() !== null);
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
    idsProds: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, idsProdsValidator],
    }),
    file: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.patchFormIfEditing();
  }

  ngOnDestroy(): void {
    this.revokeObjectUrl();
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

  protected isControlInvalid(controlName: 'title' | 'description' | 'percent' | 'idsProds'): boolean {
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
      description: promotion.description,
      percent: promotion.percent,
      idsProds: normalizeIdsProds(promotion.idsProds).join(', '),
      file: promotion.file ?? '',
    });
  }

  private buildFormData(): FormData {
    const rawValue = this.form.getRawValue();
    const formData = new FormData();

    formData.append('title', rawValue.title.trim());
    formData.append('description', rawValue.description.trim());
    formData.append('percent', String(rawValue.percent ?? 0));
    formData.append('idsProds', normalizeIdsString(rawValue.idsProds));

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
}

function idsProdsValidator(control: AbstractControl<string>): ValidationErrors | null {
  const value = control.value?.trim();

  if (!value) {
    return null;
  }

  const isValid = value
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .every((token) => /^\d+$/.test(token));

  return isValid ? null : { invalidIdsProds: true };
}

function normalizeIdsString(value: string): string {
  return value
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .join(',');
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