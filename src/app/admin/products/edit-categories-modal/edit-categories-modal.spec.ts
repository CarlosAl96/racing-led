import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { EditCategoriesModal } from './edit-categories-modal';
import { ProductsService } from '../../../core/services/products.service';
import { ToastService } from '../../../core/services/toast.service';

describe('EditCategoriesModal', () => {
  let component: EditCategoriesModal;
  let fixture: ComponentFixture<EditCategoriesModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCategoriesModal],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            getCategories: () => of({ data: ['Faros', 'Baterias'] }),
            updateCategory: () => of({ data: 'Change category success' }),
          },
        },
        {
          provide: ToastService,
          useValue: {
            setMessage: () => undefined,
          },
        },
        {
          provide: DynamicDialogRef,
          useValue: {
            close: () => undefined,
          },
        },
        {
          provide: DynamicDialogConfig,
          useValue: {
            data: {
              categories: ['Faros'],
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditCategoriesModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});