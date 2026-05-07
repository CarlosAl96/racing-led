export interface PromotionProduct {
  id: string | number;
  sku: string;
  name: string;
  index?: number;
  price: number;
  picture?: string | null;
  category?: string;
  created_at: string;
  updated_at: string;
  id_discount?: string | number | null;
}

export interface Promotion {
  id: string | number;
  title: string;
  description: string;
  file?: string | null;
  img?: string | null;
  percent: number;
  idsProds?: number[] | string[] | string | null;
  products?: PromotionProduct[] | null;
  created_at: string;
  updated_at: string;
}