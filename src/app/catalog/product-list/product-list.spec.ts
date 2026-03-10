import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ProductList } from './product-list';
import { DolarAPIService } from '../../core/services/dolar-api.service';
import { ProductsService } from '../../core/services/products.service';

class IntersectionObserverMock {
  observe(): void {}
  disconnect(): void {}
}

describe('ProductList', () => {
  let component: ProductList;
  let fixture: ComponentFixture<ProductList>;

  beforeEach(async () => {
    Object.defineProperty(window, 'IntersectionObserver', {
      writable: true,
      configurable: true,
      value: IntersectionObserverMock,
    });

    await TestBed.configureTestingModule({
      imports: [ProductList],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            getProducts: () =>
              of({
                data: [],
                pagination: {
                  total_records: 0,
                  next_page: null,
                },
              }),
          },
        },
        {
          provide: DolarAPIService,
          useValue: {
            getOfficialRate: () =>
              of({
                fuente: 'mock',
                nombre: 'oficial',
                compra: null,
                venta: null,
                promedio: 36,
                fechaActualizacion: '',
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
