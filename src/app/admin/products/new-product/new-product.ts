import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FileSelectEvent, FileUploadModule } from 'primeng/fileupload';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Product } from '../../../core/models/product';
import { ProductsService } from '../../../core/services/products.service';
import { ToastService } from '../../../core/services/toast.service';

interface NewProductDialogData {
  product?: Product;
  categories?: string[];
}

@Component({
  selector: 'app-new-product',
  imports: [
    ButtonModule,
    FileUploadModule,
    InputNumberModule,
    InputTextModule,
    ReactiveFormsModule,
    SelectModule,
  ],
  templateUrl: './new-product.html',
  styleUrl: './new-product.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewProduct implements OnInit, OnDestroy {
  private readonly productsService = inject(ProductsService);
  private readonly toastService = inject(ToastService);
  private readonly dialogRef = inject(DynamicDialogRef);
  private readonly dialogConfig = inject(DynamicDialogConfig<NewProductDialogData>);

  private readonly editingProduct = signal<Product | null>(this.dialogConfig.data?.product ?? null);
  private readonly selectedImageFile = signal<File | null>(null);
  private readonly selectedImageObjectUrl = signal<string | null>(null);
  protected readonly fallbackImage = 'assets/product-placeholder.jpg';

  protected readonly isSubmitting = signal(false);
  protected readonly isLoadingCategories = signal(false);
  protected readonly categories = signal<string[]>(this.dialogConfig.data?.categories ?? []);
  protected readonly hasSelectedNewImage = computed(() => this.selectedImageFile() !== null);
  protected readonly selectedImageName = computed(
    () => this.selectedImageFile()?.name ?? this.form.controls.url_image.value,
  );
  protected readonly currentImageUrl = computed(() => {
    const selectedPreview = this.selectedImageObjectUrl();
    if (selectedPreview) {
      return selectedPreview;
    }

    const currentImage = this.form.controls.url_image.value.trim();
    return currentImage || null;
  });
  protected readonly isEditMode = computed(() => this.editingProduct() !== null);
  protected readonly modalTitle = computed(() =>
    this.isEditMode() ? 'Editar producto' : 'Nuevo producto',
  );
  protected readonly submitLabel = computed(() => (this.isEditMode() ? 'Actualizar' : 'Crear'));

  protected readonly form = new FormGroup({
    sku: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    category: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    price: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0)],
    }),
    url_image: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.patchFormIfEditing();
    this.loadCategories();
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

  protected saveProduct(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const productFormData = this.buildFormData();
    const request$ = this.isEditMode()
      ? this.productsService.updateProduct(productFormData, this.editingProduct()!.id)
      : this.productsService.createProduct(productFormData);

    request$.pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
      next: () => {
        this.toastService.setMessage({
          severity: 'success',
          summary: this.isEditMode() ? 'Producto actualizado' : 'Producto creado',
          detail: this.isEditMode()
            ? 'Los datos del producto se actualizaron correctamente.'
            : 'El nuevo producto se registró correctamente.',
        });

        this.dialogRef.close({ saved: true });
      },
      error: (error: unknown) => {
        const detail =
          typeof error === 'string' ? error : 'No se pudo guardar el producto. Intenta nuevamente.';

        this.toastService.setMessage({
          severity: 'error',
          summary: 'Error al guardar',
          detail,
        });
      },
    });
  }

  protected isControlInvalid(controlName: 'sku' | 'name' | 'category' | 'price'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  private patchFormIfEditing(): void {
    const product = this.editingProduct();

    if (!product) {
      return;
    }

    this.form.patchValue({
      sku: product.sku,
      name: product.name,
      category: product.category ?? '',
      price: product.price,
      url_image: product.picture ?? '',
    });

    if (product.category?.trim()) {
      this.categories.update((categories) => {
        if (categories.includes(product.category!)) {
          return categories;
        }

        return [product.category!, ...categories];
      });
    }
  }

  private loadCategories(): void {
    this.isLoadingCategories.set(true);

    this.productsService
      .getCategories()
      .pipe(finalize(() => this.isLoadingCategories.set(false)))
      .subscribe({
        next: (response) => {
          const uniqueCategories = Array.from(
            new Set([...(response.data ?? []), ...this.categories()]),
          );
          this.categories.set(uniqueCategories);
        },
        error: () => {
          this.toastService.setMessage({
            severity: 'warn',
            summary: 'Categorías no disponibles',
            detail: 'No se pudieron cargar las categorías. Puedes escribir una categoría nueva.',
          });
        },
      });
  }

  private buildFormData(): FormData {
    const rawValue = this.form.getRawValue();
    const formData = new FormData();

    formData.append('sku', rawValue.sku.trim());
    formData.append('name', rawValue.name.trim());
    formData.append('category', rawValue.category.trim());
    formData.append('price', String(rawValue.price ?? 0));

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
