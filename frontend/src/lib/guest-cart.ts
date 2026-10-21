// 비회원 장바구니. 브라우저 localStorage에 두고, 로그인하면 /me/cart/merge 로 서버에 합친다.
// 가격, 이름 등은 담을 때의 스냅샷이다. 실제 금액은 로그인 후 서버가 다시 계산한다.

import type { CartItem, Totals } from "./api/types";

export const GUEST_CART_KEY = "tukfit.guestCart.v1";

export type GuestCartItem = {
  variantId: number;
  productId: number;
  productSlug: string;
  productName: string;
  colorName: string;
  size: string;
  imageUrl?: string | null;
  unitPrice: number;
  originalPrice?: number | null;
  quantity: number;
  stock: number;
};

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function loadGuestCart(): GuestCartItem[] {
  try {
    const raw = storage()?.getItem(GUEST_CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((i) => typeof i?.variantId === "number" && i.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function saveGuestCart(items: GuestCartItem[]) {
  try {
    const s = storage();
    if (!s) return;
    if (items.length) s.setItem(GUEST_CART_KEY, JSON.stringify(items));
    else s.removeItem(GUEST_CART_KEY);
  } catch {
    // 저장 공간이 막힌 브라우저(사생활 보호 모드 등)에서는 메모리 상태만 유지한다
  }
}

export function clampQuantity(qty: number, stock: number, max: number): number {
  return Math.max(1, Math.min(Math.floor(qty), max, Math.max(stock, 1)));
}

/** 같은 옵션이면 수량을 합친다 (최대 max, 재고 이내). */
export function addGuestItem(items: GuestCartItem[], item: GuestCartItem, max: number): GuestCartItem[] {
  const existing = items.find((i) => i.variantId === item.variantId);
  if (existing) {
    return items.map((i) =>
      i.variantId === item.variantId
        ? { ...i, ...item, quantity: clampQuantity(i.quantity + item.quantity, item.stock, max) }
        : i,
    );
  }
  return [...items, { ...item, quantity: clampQuantity(item.quantity, item.stock, max) }];
}

export function updateGuestQuantity(items: GuestCartItem[], variantId: number, qty: number, max: number) {
  return items.map((i) => (i.variantId === variantId ? { ...i, quantity: clampQuantity(qty, i.stock, max) } : i));
}

export function removeGuestItem(items: GuestCartItem[], variantId: number) {
  return items.filter((i) => i.variantId !== variantId);
}

/** 서버 /me/cart/merge 요청 본문 */
export function toMergePayload(items: GuestCartItem[]) {
  return items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
}

/** 비회원 장바구니를 서버 Cart와 같은 모양으로 바꿔 화면 코드를 하나로 쓴다. id는 variantId를 쓴다. */
export function guestToCartItems(items: GuestCartItem[]): CartItem[] {
  return items.map((i) => ({
    id: i.variantId,
    variantId: i.variantId,
    productId: i.productId,
    productSlug: i.productSlug,
    productName: i.productName,
    colorName: i.colorName,
    size: i.size,
    imageUrl: i.imageUrl,
    unitPrice: i.unitPrice,
    originalPrice: i.originalPrice,
    quantity: i.quantity,
    lineTotal: i.unitPrice * i.quantity,
    stock: i.stock,
    available: i.stock > 0,
  }));
}

export function calcTotals(
  items: Pick<CartItem, "lineTotal" | "quantity" | "available">[],
  shippingFee: number,
  freeShippingThreshold: number,
): Totals {
  const live = items.filter((i) => i.available);
  const subtotal = live.reduce((s, i) => s + i.lineTotal, 0);
  const fee = subtotal === 0 || subtotal >= freeShippingThreshold ? 0 : shippingFee;
  return {
    subtotal,
    discount: 0,
    shippingFee: fee,
    total: subtotal + fee,
    itemCount: live.reduce((s, i) => s + i.quantity, 0),
    freeShippingRemaining: subtotal === 0 ? freeShippingThreshold : Math.max(0, freeShippingThreshold - subtotal),
  };
}
