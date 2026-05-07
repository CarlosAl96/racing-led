import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MultiSelect } from 'primeng/multiselect';

import { NewPromotion } from './new-promotion';
import { ProductsService } from '../../../core/services/products.service';
import { PromotionsService } from '../../../core/services/promotions.service';
import { ToastService } from '../../../core/services/toast.service';

describe('NewPromotion', () => {
  let fixture: ComponentFixture<NewPromotion>;
  let componentState: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewPromotion],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            getProducts: () =>
              of({
                data: [
                  {
                    id: 'f5dd65de-027a-4687-97b3-f5623fcfeee4',
                    name: 'Producto 7',
                    sku: 'SKU-7',
                    price: 10,
                    picture: '',
                    updated_at: '',
                    created_at: '',
                  },
                  {
                    id: 'ae46b26e-9ef0-4df7-bc57-a172de83e862',
                    name: 'Producto 12',
                    sku: 'SKU-12',
                    price: 10,
                    picture: '',
                    updated_at: '',
                    created_at: '',
                  },
                ],
                pagination: {
                  total_records: 2,
                  current_page: 1,
                  limit: 50,
                  next_page: null,
                },
              }),
          },
        },
        {
          provide: PromotionsService,
          useValue: {
            createPromotion: () => of({}),
            updatePromotion: () => of({}),
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

    fixture = TestBed.createComponent(NewPromotion);
    componentState = fixture.componentInstance as any;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('builds idsProds from heterogeneous multiselect values', () => {
    componentState.form.controls.title.setValue('Promo');
    componentState.form.controls.description.setValue('Descripcion');
    componentState.form.controls.percent.setValue(10);
    componentState.form.controls.idsProds.setValue([
      { value: 'f5dd65de-027a-4687-97b3-f5623fcfeee4' },
      { id: 'ae46b26e-9ef0-4df7-bc57-a172de83e862' },
      'fa8cc332-1e7b-41de-b1ab-fd78984129fa',
    ]);

    const formData = componentState.buildFormData() as FormData;

    expect(formData.get('idsProds')).toBe(
      '["f5dd65de-027a-4687-97b3-f5623fcfeee4","ae46b26e-9ef0-4df7-bc57-a172de83e862","fa8cc332-1e7b-41de-b1ab-fd78984129fa"]',
    );
    expect(formData.getAll('idsProds[]')).toEqual([]);
  });

  it('propagates multiselect selections into the form payload', async () => {
    componentState.form.controls.title.setValue('Promo');
    componentState.form.controls.description.setValue('Descripcion');
    componentState.form.controls.percent.setValue(10);
    fixture.detectChanges();
    await fixture.whenStable();

    const multiSelect = fixture.debugElement.query(By.directive(MultiSelect)).componentInstance as MultiSelect;
    const [firstOption, secondOption] = componentState.productOptions();

    multiSelect.onOptionSelect({ originalEvent: new Event('click'), option: firstOption });
    multiSelect.onOptionSelect({ originalEvent: new Event('click'), option: secondOption });
    fixture.detectChanges();

    expect(componentState.form.controls.idsProds.value).toEqual([
      'f5dd65de-027a-4687-97b3-f5623fcfeee4',
      'ae46b26e-9ef0-4df7-bc57-a172de83e862',
    ]);

    const formData = componentState.buildFormData() as FormData;
    expect(formData.get('idsProds')).toBe(
      '["f5dd65de-027a-4687-97b3-f5623fcfeee4","ae46b26e-9ef0-4df7-bc57-a172de83e862"]',
    );
    expect(formData.getAll('idsProds[]')).toEqual([]);
  });
});