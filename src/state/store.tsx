import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { CartItem, CartTotals, Order, User } from '../domain/types';
import { getProduct } from '../lib/catalog';
import { calculateTotals, cartKey, isValidCoupon, maxQuantity } from '../lib/pricing';
import { readJSON, STORAGE_KEYS, writeJSON } from '../lib/storage';
import { track } from '../lib/analytics';

export interface Toast {
  id: number;
  message: string;
  action?: { label: string; to: string };
}

export type AddResult = { ok: true; quantity: number; capped: boolean } | { ok: false; reason: string };

interface StoreValue {
  cart: CartItem[];
  coupon: string | null;
  totals: CartTotals;
  addToCart: (productId: string, colorId: string, size: string, quantity?: number) => AddResult;
  setQuantity: (key: string, quantity: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;

  wishlist: string[];
  toggleWishlist: (productId: string) => boolean;
  isWishlisted: (productId: string) => boolean;

  user: User | null;
  signIn: (user: User) => void;
  signOut: () => void;

  orders: Order[];
  addOrder: (order: Order) => void;

  recent: string[];
  addRecent: (productId: string) => void;

  searches: string[];
  addSearch: (q: string) => void;
  clearSearches: () => void;

  toasts: Toast[];
  notify: (message: string, action?: Toast['action']) => void;
  dismissToast: (id: number) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function usePersistent<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readJSON(key, initial));
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    writeJSON(key, value);
  }, [key, value]);
  return [value, setValue] as const;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = usePersistent<CartItem[]>(STORAGE_KEYS.cart, []);
  const [coupon, setCoupon] = usePersistent<string | null>(STORAGE_KEYS.coupon, null);
  const [wishlist, setWishlist] = usePersistent<string[]>(STORAGE_KEYS.wishlist, []);
  const [user, setUser] = usePersistent<User | null>(STORAGE_KEYS.user, null);
  const [orders, setOrders] = usePersistent<Order[]>(STORAGE_KEYS.orders, []);
  const [recent, setRecent] = usePersistent<string[]>(STORAGE_KEYS.recent, []);
  const [searches, setSearches] = usePersistent<string[]>(STORAGE_KEYS.searches, []);
  const [cartOpen, setCartOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  // Drop cart lines whose product no longer exists (e.g. stale storage).
  const validCart = useMemo(() => cart.filter((i) => getProduct(i.productId)), [cart]);
  const totals = useMemo(() => calculateTotals(validCart, getProduct, coupon), [validCart, coupon]);

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const notify = useCallback(
    (message: string, action?: Toast['action']) => {
      const id = ++toastId.current;
      setToasts((t) => [...t.slice(-2), { id, message, action }]);
      window.setTimeout(() => dismissToast(id), 4000);
    },
    [dismissToast],
  );

  const addToCart = useCallback(
    (productId: string, colorId: string, size: string, quantity = 1): AddResult => {
      const product = getProduct(productId);
      if (!product) return { ok: false, reason: '더 이상 판매하지 않는 상품입니다.' };
      const max = maxQuantity(product, colorId, size);
      if (max <= 0) return { ok: false, reason: '선택한 색상의 이 사이즈는 품절입니다.' };
      const key = cartKey(productId, colorId, size);
      const existing = cart.find((i) => i.key === key)?.quantity ?? 0;
      if (existing >= max) {
        return { ok: false, reason: `이 옵션은 이미 최대 수량(${max}개)이 담겨 있습니다.` };
      }
      const next = Math.min(max, existing + quantity);
      setCart((items) =>
        items.some((i) => i.key === key)
          ? items.map((i) => (i.key === key ? { ...i, quantity: next } : i))
          : [...items, { key, productId, colorId, size, quantity: next }],
      );
      track('add_to_cart', { productId, colorId, size, quantity: next - existing });
      return { ok: true, quantity: next, capped: existing + quantity > max };
    },
    [cart, setCart],
  );

  const setQuantity = useCallback(
    (key: string, quantity: number) => {
      setCart((items) =>
        items.flatMap((i) => {
          if (i.key !== key) return [i];
          const product = getProduct(i.productId);
          if (!product) return [];
          const q = Math.max(1, Math.min(quantity, maxQuantity(product, i.colorId, i.size)));
          return [{ ...i, quantity: q }];
        }),
      );
    },
    [setCart],
  );

  const removeFromCart = useCallback((key: string) => setCart((items) => items.filter((i) => i.key !== key)), [setCart]);
  const clearCart = useCallback(() => {
    setCart([]);
    setCoupon(null);
  }, [setCart, setCoupon]);

  const applyCoupon = useCallback(
    (code: string) => {
      if (!isValidCoupon(code)) return false;
      setCoupon(code.trim().toUpperCase());
      return true;
    },
    [setCoupon],
  );
  const removeCoupon = useCallback(() => setCoupon(null), [setCoupon]);

  const isWishlisted = useCallback((id: string) => wishlist.includes(id), [wishlist]);
  const toggleWishlist = useCallback(
    (id: string) => {
      const adding = !wishlist.includes(id);
      setWishlist((w) => (adding ? [id, ...w.filter((x) => x !== id)] : w.filter((x) => x !== id)));
      if (adding) track('wishlist_add', { productId: id });
      return adding;
    },
    [wishlist, setWishlist],
  );

  const signIn = useCallback((u: User) => setUser(u), [setUser]);
  const signOut = useCallback(() => setUser(null), [setUser]);

  const addOrder = useCallback((order: Order) => setOrders((o) => [order, ...o]), [setOrders]);

  const addRecent = useCallback(
    (id: string) => setRecent((r) => (r[0] === id ? r : [id, ...r.filter((x) => x !== id)].slice(0, 8))),
    [setRecent],
  );

  const addSearch = useCallback(
    (q: string) => {
      const term = q.trim();
      if (!term) return;
      setSearches((s) => [term, ...s.filter((x) => x.toLowerCase() !== term.toLowerCase())].slice(0, 5));
      track('search', { q: term });
    },
    [setSearches],
  );
  const clearSearches = useCallback(() => setSearches([]), [setSearches]);

  const value: StoreValue = {
    cart: validCart,
    coupon,
    totals,
    addToCart,
    setQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    cartOpen,
    setCartOpen,
    wishlist,
    toggleWishlist,
    isWishlisted,
    user,
    signIn,
    signOut,
    orders,
    addOrder,
    recent,
    addRecent,
    searches,
    addSearch,
    clearSearches,
    toasts,
    notify,
    dismissToast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
