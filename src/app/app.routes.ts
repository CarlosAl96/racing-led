import { Routes } from '@angular/router';
import { AdminLayout } from './shared/layouts/admin-layout/admin-layout';
import { CatalogLayout } from './shared/layouts/catalog-layout/catalog-layout';

export const routes: Routes = [
  {
    path: 'admin',
    component: AdminLayout,
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
    // canActivate: [noAuthGuard],
  },
  {
    path: '',
    component: CatalogLayout,
    loadChildren: () => import('./catalog/catalog.routes').then((m) => m.CATALOG_ROUTES),
  },

  { path: '**', redirectTo: '', pathMatch: 'full' },
];
