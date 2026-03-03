import { Routes } from '@angular/router';
import { Layout } from './shared/layout/layout';
import { ProductList } from './catalog/product-list/product-list';

export const routes: Routes = [
  {
    path: '',
    component: ProductList,
  },
  {
    path: 'admin',
    component: Layout,
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
    // canActivate: [noAuthGuard],
  },

  { path: '**', redirectTo: '', pathMatch: 'full' },
];
