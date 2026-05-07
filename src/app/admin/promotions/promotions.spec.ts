import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Promotions } from './promotions';
import { PromotionsService } from '../../core/services/promotions.service';

describe('Promotions', () => {
  let component: Promotions;
  let fixture: ComponentFixture<Promotions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Promotions],
      providers: [
        {
          provide: PromotionsService,
          useValue: {
            getPromotions: () =>
              of({
                data: [],
                pagination: {
                  total_records: 0,
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
});
