import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { ProductsService } from '../../../core/services/products.service';
import { ToastService } from '../../../core/services/toast.service';

interface EditCategoriesDialogData {
  categories?: string[];
}

interface EditableCategory {
  id: number;
  initialName: string;
  name: string;
  draftName: string;
  isEditing: boolean;
  isSaving: boolean;
}

interface CategoryRenameResult {
  previousName: string;
  currentName: string;
}

@Component({
  selector: 'app-edit-categories-modal',
  imports: [ButtonModule, InputTextModule],
  templateUrl: './edit-categories-modal.html',
  styleUrl: './edit-categories-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditCategoriesModal {
  private readonly productsService = inject(ProductsService);
  private readonly toastService = inject(ToastService);
  private readonly dialogRef = inject(DynamicDialogRef);
  private readonly dialogConfig = inject(DynamicDialogConfig<EditCategoriesDialogData>);

  private readonly nextCategoryId = signal(0);

  protected readonly isLoadingCategories = signal(false);
  protected readonly categories = signal<EditableCategory[]>([]);
  protected readonly hasCategories = computed(() => this.categories().length > 0);
  protected readonly hasSavedChanges = computed(() =>
    this.categories().some((category) => category.initialName !== category.name),
  );

  constructor() {
    this.setCategories(this.dialogConfig.data?.categories ?? []);
    this.loadCategories();
  }

  protected close(): void {
    this.dialogRef.close({
      saved: this.hasSavedChanges(),
      renamedCategories: this.getRenamedCategories(),
    });
  }

  protected startEditing(categoryId: number): void {
    this.categories.update((categories) =>
      categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              isEditing: true,
              draftName: category.name,
            }
          : category,
      ),
    );
  }

  protected cancelEditing(categoryId: number): void {
    this.categories.update((categories) =>
      categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              isEditing: false,
              draftName: category.name,
            }
          : category,
      ),
    );
  }

  protected updateDraft(categoryId: number, value: string): void {
    this.categories.update((categories) =>
      categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              draftName: value,
            }
          : category,
      ),
    );
  }

  protected saveCategory(categoryId: number): void {
    const category = this.categories().find((item) => item.id === categoryId);

    if (!category || category.isSaving) {
      return;
    }

    const nextName = category.draftName.trim();

    if (!nextName) {
      this.toastService.setMessage({
        severity: 'warn',
        summary: 'Nombre requerido',
        detail: 'Debes ingresar un nombre válido para la categoría.',
      });
      return;
    }

    if (nextName === category.name) {
      this.cancelEditing(categoryId);
      return;
    }

    const alreadyExists = this.categories().some(
      (item) => item.id !== categoryId && item.name.toLocaleLowerCase() === nextName.toLocaleLowerCase(),
    );

    if (alreadyExists) {
      this.toastService.setMessage({
        severity: 'warn',
        summary: 'Categoría duplicada',
        detail: 'Ya existe una categoría con ese nombre.',
      });
      return;
    }

    this.patchCategory(categoryId, { isSaving: true });

    this.productsService
      .updateCategory(category.name, nextName)
      .pipe(finalize(() => this.patchCategory(categoryId, { isSaving: false })))
      .subscribe({
        next: () => {
          this.categories.update((categories) =>
            [...categories]
              .map((item) =>
                item.id === categoryId
                  ? {
                      ...item,
                      name: nextName,
                      draftName: nextName,
                      isEditing: false,
                    }
                  : item,
              )
              .sort((left, right) => left.name.localeCompare(right.name, 'es', { sensitivity: 'base' })),
          );

          this.toastService.setMessage({
            severity: 'success',
            summary: 'Categoría actualizada',
            detail: 'El nombre de la categoría se actualizó correctamente.',
          });
        },
        error: (error: unknown) => {
          const detail =
            typeof error === 'string'
              ? error
              : 'No se pudo actualizar la categoría. Intenta nuevamente.';

          this.toastService.setMessage({
            severity: 'error',
            summary: 'Error al actualizar',
            detail,
          });
        },
      });
  }

  private loadCategories(): void {
    this.isLoadingCategories.set(true);

    this.productsService
      .getCategories()
      .pipe(finalize(() => this.isLoadingCategories.set(false)))
      .subscribe({
        next: (response) => {
          this.setCategories(response.data ?? []);
        },
        error: () => {
          this.toastService.setMessage({
            severity: 'warn',
            summary: 'Categorías no disponibles',
            detail: 'No se pudieron cargar las categorías actuales.',
          });
        },
      });
  }

  private setCategories(categories: string[]): void {
    const uniqueCategories = Array.from(
      new Set(categories.map((category) => category.trim()).filter((category) => !!category)),
    ).sort((left, right) => left.localeCompare(right, 'es', { sensitivity: 'base' }));

    this.nextCategoryId.set(0);
    this.categories.set(
      uniqueCategories.map((name) => ({
        id: this.allocateCategoryId(),
        initialName: name,
        name,
        draftName: name,
        isEditing: false,
        isSaving: false,
      })),
    );
  }

  private allocateCategoryId(): number {
    const nextId = this.nextCategoryId() + 1;
    this.nextCategoryId.set(nextId);
    return nextId;
  }

  private patchCategory(categoryId: number, changes: Partial<EditableCategory>): void {
    this.categories.update((categories) =>
      categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              ...changes,
            }
          : category,
      ),
    );
  }

  private getRenamedCategories(): CategoryRenameResult[] {
    return this.categories()
      .filter((category) => category.initialName !== category.name)
      .map((category) => ({
        previousName: category.initialName,
        currentName: category.name,
      }));
  }
}