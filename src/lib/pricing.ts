import type { CartItem, CartTotals, Product } from '../domain/types';

export const COUPON_CODE = 'TOOK10';
export const COUPON_RATE = 0.1;
export const COUPON_MAX = 20000;
export const SHIPPING_FEE = 3000;
export const FREE_SHIPPING_THRESHOLD = 100000;
export const MAX_PER_VARIANT = 5;

export function isValidCoupon(code: string | null | undefined): boolean {
  return (code ?? '').trim().toUpperCase() === COUPON_CODE;
}

export function couponDiscount(subtotal: number, code: string | null | undefined): number {
  if (!isValidCoupon(code) || subtotal <= 0) return 0;
  return Math.min(Math.floor(subtotal * COUPON_RATE), COUPON_MAX);
}

/** Shipping is based on the merchandise subtotal before coupon discounts. */
export function shippingFee(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

export function discountPercent(product: Pick<Product, 'price' | 'originalPrice'>): number {
  if (!product.originalPrice || product.originalPrice <= product.price) return 0;
  return Math.round((1 - product.price / product.originalPrice) * 100);
}

export function lineSubtotal(items: CartItem[], lookup: (id: string) => Product | undefined): number {
  return items.reduce((sum, item) => sum + (lookup(item.productId)?.price ?? 0) * item.quantity, 0);
}

export function calculateTotals(
  items: CartItem[],
  lookup: (id: string) => Product | undefined,
  coupon: string | null,
): CartTotals {
  const subtotal = lineSubtotal(items, lookup);
  const discount = couponDiscount(subtotal, coupon);
  const shipping = shippingFee(subtotal);
  return {
    subtotal,
    discount,
    shipping,
    total: subtotal - discount + shipping,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    freeShippingRemaining: Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal),
  };
}

export function variantStock(product: Product, colorId: string, size: string): number {
  return product.stock[colorId]?.[size] ?? 0;
}

/** Maximum units a shopper may hold in the cart for one variant. */
export function maxQuantity(product: Product, colorId: string, size: string): number {
  return Math.min(MAX_PER_VARIANT, variantStock(product, colorId, size));
}

export function isInStock(product: Product): boolean {
  return Object.values(product.stock).some((sizes) => Object.values(sizes).some((n) => n > 0));
}

export function cartKey(productId: string, colorId: string, size: string): string {
  return `${productId}|${colorId}|${size}`;
}
