import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Auth } from './auth';
import { AdminAuthService } from '../../core/services/admin-auth.service';
import { ToastService } from '../../core/services/toast.service';

describe('Auth', () => {
  let component: Auth;
  let fixture: ComponentFixture<Auth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Auth],
      providers: [
        provideRouter([]),
        {
          provide: AdminAuthService,
          useValue: {
            signInWithEmailPassword: async () => ({ ok: true }),
            hasValidAdminSession: async () => false,
          },
        },
        {
          provide: ToastService,
          useValue: {
            setMessage: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Auth);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
