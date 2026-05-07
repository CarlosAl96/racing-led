import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ShoppingCart } from './shopping-cart';
import { DolarAPIService } from '../../core/services/dolar-api.service';
import { QuoteCartService } from '../../core/services/quote-cart.service';

describe('ShoppingCart', () => {
  let component: ShoppingCart;
  let fixture: ComponentFixture<ShoppingCart>;
  let quoteCartService: QuoteCartService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShoppingCart],
      providers: [
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

    fixture = TestBed.createComponent(ShoppingCart);
    component = fixture.componentInstance;
    quoteCartService = TestBed.inject(QuoteCartService);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use discounted prices in totals and whatsapp message', () => {
    quoteCartService.addProduct({
      id: 'prod-1',
      sku: 'SKU-1',
      name: 'Producto con descuento',
      category: 'Categoria',
      price: 100,
      updated_at: '',
      created_at: '',
      picture: '',
      discounts: {
        id: 'disc-1',
        img: '',
        title: 'Promo',
        percent: 0.21,
        created_at: '',
        updated_at: '',
        description: '',
      },
    });

    expect(component['totalAmountUsd']()).toBe(79);

    const message = component['buildWhatsAppMessage']();

    expect(message).toContain('Descuento: 21%');
    expect(message).toContain('Precio original USD: 100.00');
    expect(message).toContain('Precio con descuento USD: 79.00');
    expect(message).toContain('Subtotal USD: 79.00');
  });
});
