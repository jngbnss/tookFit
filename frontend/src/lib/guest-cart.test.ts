import { describe, expect, it } from "vitest";
import {
  addGuestItem,
  calcTotals,
  GUEST_CART_KEY,
  guestToCartItems,
  loadGuestCart,
  removeGuestItem,
  saveGuestCart,
  toMergePayload,
  updateGuestQuantity,
  type GuestCartItem,
} from "./guest-cart";

const item = (over: Partial<GuestCartItem> = {}): GuestCartItem => ({
  variantId: 1,
  productId: 10,
  productSlug: "coat",
  productName: "코트",
  colorName: "블랙",
  size: "M",
  unitPrice: 20000,
  quantity: 1,
  stock: 10,
  ...over,
});

describe("guest cart", () => {
  it("같은 옵션은 수량을 합치고 최대 수량을 넘지 않는다", () => {
    let cart = addGuestItem([], item({ quantity: 2 }), 5);
    cart = addGuestItem(cart, item({ quantity: 4 }), 5);
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(5);
  });

  it("다른 옵션은 따로 담는다", () => {
    const cart = addGuestItem(addGuestItem([], item(), 5), item({ variantId: 2, size: "L" }), 5);
    expect(cart.map((i) => i.variantId)).toEqual([1, 2]);
  });

  it("재고보다 많이 담을 수 없다", () => {
    const cart = addGuestItem([], item({ quantity: 5, stock: 2 }), 5);
    expect(cart[0].quantity).toBe(2);
  });

  it("수량 변경과 삭제", () => {
    let cart = [item(), item({ variantId: 2 })];
    cart = updateGuestQuantity(cart, 2, 9, 5);
    expect(cart[1].quantity).toBe(5);
    cart = updateGuestQuantity(cart, 2, 0, 5);
    expect(cart[1].quantity).toBe(1);
    expect(removeGuestItem(cart, 1).map((i) => i.variantId)).toEqual([2]);
  });

  it("localStorage에 저장하고 읽는다. 깨진 값은 무시한다", () => {
    saveGuestCart([item()]);
    expect(loadGuestCart()).toHaveLength(1);
    localStorage.setItem(GUEST_CART_KEY, "{not json");
    expect(loadGuestCart()).toEqual([]);
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify([{ foo: 1 }, item({ quantity: 0 }), item()]));
    expect(loadGuestCart()).toHaveLength(1);
    saveGuestCart([]);
    expect(localStorage.getItem(GUEST_CART_KEY)).toBeNull();
  });

  it("로그인 시 서버로 합칠 본문은 variantId와 수량만 담는다", () => {
    expect(toMergePayload([item({ quantity: 2 }), item({ variantId: 7, quantity: 1 })])).toEqual([
      { variantId: 1, quantity: 2 },
      { variantId: 7, quantity: 1 },
    ]);
  });

  it("금액 계산: 무료배송 기준과 품절 제외", () => {
    const lines = guestToCartItems([item({ quantity: 2 }), item({ variantId: 2, stock: 0 })]);
    expect(lines[1].available).toBe(false);
    const t = calcTotals(lines, 3000, 50000);
    expect(t).toMatchObject({ subtotal: 40000, shippingFee: 3000, total: 43000, itemCount: 2, freeShippingRemaining: 10000 });
    const free = calcTotals(guestToCartItems([item({ quantity: 3 })]), 3000, 50000);
    expect(free).toMatchObject({ subtotal: 60000, shippingFee: 0, total: 60000, freeShippingRemaining: 0 });
    expect(calcTotals([], 3000, 50000)).toMatchObject({ subtotal: 0, shippingFee: 0, total: 0 });
  });
});
