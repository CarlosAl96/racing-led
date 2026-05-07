export interface ProductDiscount {
  id: string | number;
  img?: string | null;
  title: string;
  percent: number;
  created_at: string;
  updated_at: string;
  description: string;
}

export interface Product {
  id: string | number;
  sku: string;
  name: string;
  category?: string;
  price: number;
  updated_at: string;
  created_at: string;
  picture: string;
  id_discount?: string | number | null;
  index?: number;
  discounts?: ProductDiscount | null;
}

export function resolveProductDiscountPercent(product: Product): number {
  const percent = product.discounts?.percent ?? 0;
  const normalizedPercent = percent <= 1 ? percent * 100 : percent;

  if (!Number.isFinite(normalizedPercent) || normalizedPercent <= 0) {
    return 0;
  }

  return normalizedPercent;
}

export function hasProductDiscount(product: Product): boolean {
  return resolveProductDiscountPercent(product) > 0;
}

export function resolveProductDiscountedPriceUsd(product: Product): number {
  const discountPercent = resolveProductDiscountPercent(product);

  if (discountPercent <= 0) {
    return product.price;
  }

  return product.price * (1 - discountPercent / 100);
}
