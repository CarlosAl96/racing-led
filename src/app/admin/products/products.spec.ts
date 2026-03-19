import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Products } from './products';
import { DolarAPIService } from '../../core/services/dolar-api.service';
import { ProductsService } from '../../core/services/products.service';

describe('Products', () => {
  let component: Products;
  let fixture: ComponentFixture<Products>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Products],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            getProducts: () =>
              of({
                data: [],
                pagination: {
                  total_records: 0,
                  current_page: 1,
                  limit: 20,
                  next_page: null,
                },
              }),
            getCategories: () => of({ data: [] }),
            deleteProduct: () => of({}),
          },
        },
        {
          provide: DolarAPIService,
          useValue: {
            getParallelRate: () =>
              of({
                fuente: 'BCV',
                nombre: 'Paralelo',
                compra: null,
                venta: null,
                promedio: null,
                fechaActualizacion: '',
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Products);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
