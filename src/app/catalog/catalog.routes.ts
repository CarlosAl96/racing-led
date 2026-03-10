import { Routes } from '@angular/router';
import { ProductList } from './product-list/product-list';

export const CATALOG_ROUTES: Routes = [
  { path: '', component: ProductList },
  { path: '**', redirectTo: '' },
];
