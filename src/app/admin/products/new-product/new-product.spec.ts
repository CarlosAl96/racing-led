import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { NewProduct } from './new-product';
import { ProductsService } from '../../../core/services/products.service';
import { ToastService } from '../../../core/services/toast.service';

describe('NewProduct', () => {
  let component: NewProduct;
  let fixture: ComponentFixture<NewProduct>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewProduct],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            getCategories: () => of({ data: [] }),
            createProduct: () => of({}),
            updateProduct: () => of({}),
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
            data: {},
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewProduct);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
