import type { Product } from '../domain/types';

/** First in-stock color/size, used when a product is dropped on the cart without choosing options. */
export function defaultVariant(p: Product): { colorId: string; size: string } | null {
  for (const c of p.colors) for (const s of p.sizes) if ((p.stock[c.id]?.[s] ?? 0) > 0) return { colorId: c.id, size: s };
  return null;
}
