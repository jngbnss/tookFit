// Thin localStorage adapter. Only non-sensitive demo state passes through here.
export const STORAGE_KEYS = {
  cart: 'tookfit.cart.v1',
  coupon: 'tookfit.coupon.v1',
  wishlist: 'tookfit.wishlist.v1',
  user: 'tookfit.user.v1',
  orders: 'tookfit.orders.v1',
  recent: 'tookfit.recent.v1',
  searches: 'tookfit.searches.v1',
  analytics: 'tookfit.analytics.v1',
  promoHiddenOn: 'tookfit.promo.hiddenOn.v1',
} as const;

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be full or disabled (private mode); the demo keeps working in memory.
  }
}
