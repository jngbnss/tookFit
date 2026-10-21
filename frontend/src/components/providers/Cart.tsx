"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cartApi } from "@/lib/api/me";
import type { CartItem, Totals } from "@/lib/api/types";
import {
  addGuestItem,
  calcTotals,
  guestToCartItems,
  loadGuestCart,
  removeGuestItem,
  saveGuestCart,
  toMergePayload,
  updateGuestQuantity,
  type GuestCartItem,
} from "@/lib/guest-cart";
import { useAuth } from "./Auth";
import { useSettings } from "./Settings";

type CartState = {
  items: CartItem[];
  totals: Totals;
  count: number;
  loading: boolean;
  /** 로그인 회원이면 서버 장바구니, 아니면 브라우저 장바구니 */
  mode: "server" | "guest";
  add: (item: GuestCartItem) => Promise<void>;
  update: (id: number, quantity: number) => Promise<void>;
  remove: (id: number) => Promise<void>;
  clear: () => Promise<void>;
  reload: () => Promise<void>;
};

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { me, ready } = useAuth();
  const settings = useSettings();
  const [guest, setGuest] = useState<GuestCartItem[]>([]);
  const [server, setServer] = useState<{ items: CartItem[]; totals: Totals } | null>(null);
  const [loading, setLoading] = useState(true);
  const mergedFor = useRef<number | null>(null);

  // 브라우저 장바구니는 마운트 후에 읽는다 (서버 렌더링과 어긋나지 않게)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage는 마운트 후에만 읽을 수 있다
    setGuest(loadGuestCart());
  }, []);

  const reload = useCallback(async () => {
    if (!me) return;
    setServer(await cartApi.get());
  }, [me]);

  // 로그인되면 비회원 장바구니를 서버로 합치고, 로그아웃되면 서버 장바구니를 비운다
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    (async () => {
      if (!me) {
        mergedFor.current = null;
        setServer(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const local = loadGuestCart();
        let cart;
        if (local.length && mergedFor.current !== me.id) {
          cart = await cartApi.merge(toMergePayload(local));
          saveGuestCart([]);
          if (alive) setGuest([]);
        } else {
          cart = await cartApi.get();
        }
        mergedFor.current = me.id;
        if (alive) setServer(cart);
      } catch {
        if (alive) setServer({ items: [], totals: calcTotals([], settings.shippingFee, settings.freeShippingThreshold) });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [me, ready, settings.shippingFee, settings.freeShippingThreshold]);

  const max = settings.maxQuantityPerItem;

  const setGuestAndSave = useCallback((next: GuestCartItem[]) => {
    setGuest(next);
    saveGuestCart(next);
  }, []);

  const add = useCallback(
    async (item: GuestCartItem) => {
      if (me) {
        setServer(await cartApi.add(item.variantId, item.quantity));
      } else {
        setGuestAndSave(addGuestItem(loadGuestCart(), item, max));
      }
    },
    [me, max, setGuestAndSave],
  );

  const update = useCallback(
    async (id: number, quantity: number) => {
      if (me) setServer(await cartApi.update(id, quantity));
      else setGuestAndSave(updateGuestQuantity(guest, id, quantity, max));
    },
    [me, guest, max, setGuestAndSave],
  );

  const remove = useCallback(
    async (id: number) => {
      if (me) {
        const cart = await cartApi.remove(id);
        setServer(cart ?? (await cartApi.get()));
      } else {
        setGuestAndSave(removeGuestItem(guest, id));
      }
    },
    [me, guest, setGuestAndSave],
  );

  const clear = useCallback(async () => {
    if (me) {
      await cartApi.clear();
      setServer(await cartApi.get());
    } else {
      setGuestAndSave([]);
    }
  }, [me, setGuestAndSave]);

  const value = useMemo<CartState>(() => {
    if (me && server) {
      return {
        items: server.items,
        totals: server.totals,
        count: server.items.reduce((s, i) => s + i.quantity, 0),
        loading,
        mode: "server",
        add,
        update,
        remove,
        clear,
        reload,
      };
    }
    const items = guestToCartItems(guest);
    return {
      items,
      totals: calcTotals(items, settings.shippingFee, settings.freeShippingThreshold),
      count: items.reduce((s, i) => s + i.quantity, 0),
      loading: me ? true : false,
      mode: me ? "server" : "guest",
      add,
      update,
      remove,
      clear,
      reload,
    };
  }, [me, server, guest, loading, add, update, remove, clear, reload, settings.shippingFee, settings.freeShippingThreshold]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
