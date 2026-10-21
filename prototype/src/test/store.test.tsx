import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../lib/storage';
import { StoreProvider, useStore } from '../state/store';
import { findSoldOut, findVariant, product } from './utils';

const wrapper = ({ children }: { children: ReactNode }) => <StoreProvider>{children}</StoreProvider>;
const setup = () => renderHook(() => useStore(), { wrapper });

describe('cart store', () => {
  it('changes quantities and keeps variants separate', () => {
    const p = product('tf-ow-01');
    const { result } = setup();
    const [c1, c2] = p.colors;
    const s = p.sizes.find((size) => p.stock[c1.id][size] >= 3 && p.stock[c2.id][size] >= 1)!;
    act(() => void result.current.addToCart(p.id, c1.id, s, 1));
    act(() => void result.current.addToCart(p.id, c1.id, s, 1));
    act(() => void result.current.addToCart(p.id, c2.id, s, 1));
    expect(result.current.cart).toHaveLength(2);
    expect(result.current.cart[0].quantity).toBe(2);
    expect(result.current.totals.itemCount).toBe(3);

    act(() => result.current.setQuantity(result.current.cart[0].key, 3));
    expect(result.current.cart[0].quantity).toBe(3);
    act(() => result.current.setQuantity(result.current.cart[0].key, 0));
    expect(result.current.cart[0].quantity).toBe(1);
    act(() => result.current.removeFromCart(result.current.cart[1].key));
    expect(result.current.cart).toHaveLength(1);
  });

  it('enforces stock and the five-per-variant maximum', () => {
    const p = product('tf-tp-02');
    const { result } = setup();
    const big = findVariant(p, 6);
    let res!: ReturnType<typeof result.current.addToCart>;
    act(() => {
      res = result.current.addToCart(p.id, big.color.id, big.size, 9);
    });
    expect(res).toMatchObject({ ok: true, quantity: 5, capped: true });
    act(() => {
      res = result.current.addToCart(p.id, big.color.id, big.size, 1);
    });
    expect(res.ok).toBe(false);
    act(() => result.current.setQuantity(result.current.cart[0].key, 50));
    expect(result.current.cart[0].quantity).toBe(5);

    const sold = findSoldOut(p);
    act(() => {
      res = result.current.addToCart(p.id, sold.color.id, sold.size, 1);
    });
    expect(res).toEqual({ ok: false, reason: expect.stringMatching(/품절/) });

    const low = Object.entries(p.stock).flatMap(([c, sizes]) => Object.entries(sizes).filter(([, n]) => n > 0 && n < 5).map(([s, n]) => ({ c, s, n })))[0];
    if (low) {
      act(() => {
        res = result.current.addToCart(p.id, low.c, low.s, 5);
      });
      expect(res).toMatchObject({ ok: true, quantity: low.n });
    }
  });

  it('persists the cart, coupon, and wishlist to localStorage and restores them', () => {
    const p = product('tf-kn-01');
    const v = findVariant(p);
    const first = setup();
    act(() => void first.result.current.addToCart(p.id, v.color.id, v.size, 2));
    act(() => void first.result.current.applyCoupon('tuk10'));
    act(() => void first.result.current.toggleWishlist('tf-ac-02'));
    first.unmount();

    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.cart)!)).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.wishlist)!)).toEqual(['tf-ac-02']);

    const second = setup();
    expect(second.result.current.cart[0]).toMatchObject({ productId: p.id, quantity: 2 });
    expect(second.result.current.coupon).toBe('TUK10');
    expect(second.result.current.totals.discount).toBe(Math.min(20000, Math.floor(p.price * 2 * 0.1)));
    expect(second.result.current.isWishlisted('tf-ac-02')).toBe(true);
    act(() => void second.result.current.toggleWishlist('tf-ac-02'));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.wishlist)!)).toEqual([]);
  });

  it('rejects invalid coupons and persists mock sign-in', () => {
    const { result, unmount } = setup();
    let ok = true;
    act(() => {
      ok = result.current.applyCoupon('FREE50');
    });
    expect(ok).toBe(false);
    act(() => result.current.signIn({ name: 'Demo User', email: 'demo@example.com' }));
    unmount();
    expect(setup().result.current.user?.email).toBe('demo@example.com');
  });
});
