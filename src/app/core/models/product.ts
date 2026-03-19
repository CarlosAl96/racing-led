export interface Product {
  id: number;
  sku: string;
  name: string;
  category?: string;
  price: number;
  updated_at: string;
  created_at: string;
  picture: string;
}
