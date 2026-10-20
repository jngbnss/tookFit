import { describe, expect, it } from 'vitest';
import { PRODUCTS } from '../data/products';
import type { CartItem } from '../domain/types';
import { getProduct } from '../lib/catalog';
import { formatKRW } from '../lib/format';
import { calculateTotals, couponDiscount, discountPercent, maxQuantity, shippingFee } from '../lib/pricing';

const item = (productId: string, quantity: number, colorId = 'black', size = 'M'): CartItem => ({
  key: `${productId}|${colorId}|${size}`,
  productId,
  colorId,
  size,
  quantity,
});

describe('pricing', () => {
  it('calculates subtotal, shipping, and total for a cart', () => {
    // Studio long-sleeve tee ₩29,000 × 1 → below free-shipping threshold
    const totals = calculateTotals([item('tf-tp-02', 1)], getProduct, null);
    expect(totals).toMatchObject({ subtotal: 29000, discount: 0, shipping: 3000, total: 32000, itemCount: 1, freeShippingRemaining: 71000 });
  });

  it('applies the TUK10 coupon at 10% and caps it at ₩20,000', () => {
    expect(couponDiscount(150000, 'TUK10')).toBe(15000);
    expect(couponDiscount(150000, 'tuk10')).toBe(15000);
    expect(couponDiscount(389000, 'TUK10')).toBe(20000);
    expect(couponDiscount(150000, 'NOPE')).toBe(0);
    const totals = calculateTotals([item('tf-ow-01', 1)], getProduct, 'TUK10');
    expect(totals).toMatchObject({ subtotal: 389000, discount: 20000, shipping: 0, total: 369000 });
  });

  it('makes shipping free at ₩100,000 merchandise subtotal, before coupon', () => {
    expect(shippingFee(0)).toBe(0);
    expect(shippingFee(99999)).toBe(3000);
    expect(shippingFee(100000)).toBe(0);
    // ₩89,000 × 1 still pays shipping; × 2 = ₩178,000 → free even after coupon
    expect(calculateTotals([item('tf-tp-01', 1)], getProduct, null).shipping).toBe(3000);
    const t = calculateTotals([item('tf-tp-01', 2)], getProduct, 'TUK10');
    expect(t).toMatchObject({ subtotal: 178000, discount: 17800, shipping: 0, total: 160200 });
  });

  it('computes discount percentages', () => {
    expect(discountPercent({ price: 80, originalPrice: 100 })).toBe(20);
    expect(discountPercent({ price: 100 })).toBe(0);
  });

  it('limits quantity to stock and five per variant', () => {
    for (const p of PRODUCTS) {
      for (const c of p.colors) for (const s of p.sizes) expect(maxQuantity(p, c.id, s)).toBeLessThanOrEqual(5);
    }
  });

  it('formats Korean won', () => {
    expect(formatKRW(389000)).toBe('₩389,000');
  });
});
