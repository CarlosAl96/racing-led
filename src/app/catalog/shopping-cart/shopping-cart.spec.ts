import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ShoppingCart } from './shopping-cart';
import { DolarAPIService } from '../../core/services/dolar-api.service';

describe('ShoppingCart', () => {
  let component: ShoppingCart;
  let fixture: ComponentFixture<ShoppingCart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShoppingCart],
      providers: [
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

    fixture = TestBed.createComponent(ShoppingCart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
