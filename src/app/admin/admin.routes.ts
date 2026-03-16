import { Routes } from '@angular/router';
import { Auth } from './auth/auth';
import { Products } from './products/products';
import { adminAuthGuard } from '../core/guards/admin-auth.guard';
import { adminLoginGuard } from '../core/guards/admin-login.guard';

export const ADMIN_ROUTES: Routes = [
  { path: 'login', component: Auth, canActivate: [adminLoginGuard] },
  { path: 'productos', component: Products, canActivate: [adminAuthGuard] },
  { path: '**', redirectTo: 'login' },
];
