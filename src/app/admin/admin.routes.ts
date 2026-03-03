import { Routes } from '@angular/router';
import { Auth } from './auth/auth';
import { Products } from './products/products';

export const ADMIN_ROUTES: Routes = [
  { path: 'login', component: Auth },
  { path: 'productos', component: Products },
  { path: '**', redirectTo: 'login' },
];
