import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Promotions } from './promotions';
import { PromotionsService } from '../../core/services/promotions.service';

describe('Promotions', () => {
  let component: Promotions;
  let fixture: ComponentFixture<Promotions>;

  type PromotionsState = {
    promotions: () => Array<{
      id: string | number;
      title: string;
      description: string;
      percent: number;
      img?: string | null;
      idsProds?: string[] | null;
      products?: Array<{ id: string | number }> | null;
      created_at: string;
      updated_at: string;
    }>;
    resolvePromotionImage: (promotion: {
      img?: string | null;
      file?: string | null;
      title: string;
      description: string;
      id: string | number;
      percent: number;
      created_at: string;
      updated_at: string;
    }) => string;
    resolveProductsCount: (promotion: {
      products?: Array<{ id: string | number }> | null;
      idsProds?: string[] | null;
      title: string;
      description: string;
      id: string | number;
      percent: number;
      created_at: string;
      updated_at: string;
    }) => number;
    resolveIdsProds: (promotion: {
      products?: Array<{ id: string | number }> | null;
      idsProds?: string[] | null;
      title: string;
      description: string;
      id: string | number;
      percent: number;
      created_at: string;
      updated_at: string;
    }) => string;
    resolvePercent: (percent: number) => string;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Promotions],
      providers: [
        {
          provide: PromotionsService,
          useValue: {
            getPromotions: () =>
              of({
                data: [
                  {
                    id: 'promo-1',
                    title: 'Promo',
                    description: 'Test',
                    percent: 0.1,
                    img: 'https://example.com/promo.webp',
                    products: [{ id: 'prod-1' }, { id: 'prod-2' }],
                    created_at: '',
                    updated_at: '',
                  },
                ],
                pagination: {
                  total_records: 1,
                  current_page: 1,
                  limit: 20,
                  next_page: null,
                },
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Promotions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should resolve decimal percentages, linked products count and image from the current api shape', () => {
    const state = component as unknown as PromotionsState;
    const [promotion] = state.promotions();

    expect(state.resolvePercent(promotion.percent)).toBe('10');
    expect(state.resolveProductsCount(promotion)).toBe(2);
    expect(state.resolveIdsProds(promotion)).toBe('prod-1, prod-2');
    expect(state.resolvePromotionImage(promotion)).toBe('https://example.com/promo.webp');
  });
});
