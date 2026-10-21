"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { errorMessage } from "@/lib/api/client";
import { wishlistApi } from "@/lib/api/me";
import { useAuth } from "./Auth";
import { useToast } from "./Toast";

type WishlistState = {
  has: (productId: number) => boolean;
  toggle: (productId: number, name?: string) => Promise<void>;
  count: number;
};

const WishlistContext = createContext<WishlistState>({ has: () => false, toggle: async () => {}, count: 0 });

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { me } = useAuth();
  const { notify } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [ids, setIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let alive = true;
    if (!me) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 로그아웃되면 목록을 비운다
      setIds(new Set());
      return;
    }
    wishlistApi
      .list()
      .then((list) => alive && setIds(new Set(list.map((p) => p.id))))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [me]);

  const toggle = useCallback(
    async (productId: number, name?: string) => {
      if (!me) {
        notify("위시리스트는 로그인 후 사용할 수 있어요.");
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      const had = ids.has(productId);
      const next = new Set(ids);
      if (had) next.delete(productId);
      else next.add(productId);
      setIds(next);
      try {
        if (had) await wishlistApi.remove(productId);
        else await wishlistApi.add(productId);
        notify(had ? `${name ?? "상품"}을(를) 위시리스트에서 뺐어요.` : `${name ?? "상품"}을(를) 위시리스트에 담았어요.`);
      } catch (e) {
        setIds(ids);
        notify(errorMessage(e), "error");
      }
    },
    [me, ids, notify, router, pathname],
  );

  const value = useMemo(() => ({ has: (id: number) => ids.has(id), toggle, count: ids.size }), [ids, toggle]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => useContext(WishlistContext);
