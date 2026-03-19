import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { CatalogLayout } from './catalog-layout';
import { DolarAPIService } from '../../../core/services/dolar-api.service';

describe('CatalogLayout', () => {
  let component: CatalogLayout;
  let fixture: ComponentFixture<CatalogLayout>;

  beforeEach(async () => {
    Object.defineProperty(window, 'ResizeObserver', {
      writable: true,
      configurable: true,
      value: class {
        observe(): void {}
        disconnect(): void {}
      },
    });

    await TestBed.configureTestingModule({
      imports: [CatalogLayout],
      providers: [
        provideRouter([]),
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

    fixture = TestBed.createComponent(CatalogLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
