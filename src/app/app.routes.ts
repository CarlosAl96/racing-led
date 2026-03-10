import { Routes } from '@angular/router';
import { AdminLayout } from './shared/layouts/admin-layout/admin-layout';
import { ProductList } from './catalog/product-list/product-list';
import { CatalogLayout } from './shared/layouts/catalog-layout/catalog-layout';

export const routes: Routes = [
  {
    path: '',
    component: CatalogLayout,
    loadChildren: () => import('./catalog/catalog.routes').then((m) => m.CATALOG_ROUTES),
  },
  {
    path: 'admin',
    component: AdminLayout,
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
    // canActivate: [noAuthGuard],
  },

  { path: '**', redirectTo: '', pathMatch: 'full' },
];
