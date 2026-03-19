import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { ProductList } from './product-list';
import { DolarAPIService } from '../../core/services/dolar-api.service';
import { ProductsService } from '../../core/services/products.service';

let observeSpy: ReturnType<typeof vi.fn>;
let disconnectSpy: ReturnType<typeof vi.fn>;

class IntersectionObserverMock {
  observe = observeSpy;
  disconnect = disconnectSpy;
}

describe('ProductList', () => {
  let component: ProductList;
  let fixture: ComponentFixture<ProductList>;
  let getProductsSpy: ReturnType<typeof vi.fn>;
  let getCategoriesSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    observeSpy = vi.fn();
    disconnectSpy = vi.fn();
    getCategoriesSpy = vi.fn().mockReturnValue(
      of({
        data: ['ACCESORIOS', 'ILUMINACION'],
      }),
    );
    getProductsSpy = vi.fn().mockReturnValue(
      of({
        data: [
          {
            id: 1,
            sku: 'SKU-1',
            name: 'Producto 1',
            category: 'Motor',
            price: 10,
            updated_at: '',
            created_at: '',
            url_image: '',
          },
        ],
        pagination: {
          total_records: 1,
          current_page: 1,
          limit: 20,
          next_page: null,
        },
      }),
    );

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
            getCategories: getCategoriesSpy,
            getProducts: getProductsSpy,
          },
        },
        {
          provide: DolarAPIService,
          useValue: {
            getParallelRate: () =>
              of({
                fuente: 'mock',
                nombre: 'paralelo',
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
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should observe the infinite scroll trigger after the first page renders', () => {
    expect(getProductsSpy).toHaveBeenCalledTimes(1);
    expect(observeSpy).toHaveBeenCalledTimes(1);
  });

  it('should request products using the selected category and search term', () => {
    const productList = component as unknown as {
      filtersForm: {
        setValue: (value: { search: string; category: string }) => void;
      };
      applyFilters: () => void;
    };

    getProductsSpy.mockClear();
    productList.filtersForm.setValue({
      search: 'led',
      category: 'ILUMINACION',
    });

    productList.applyFilters();

    expect(getProductsSpy).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      search: 'led',
      category: 'ILUMINACION',
    });
  });
});
