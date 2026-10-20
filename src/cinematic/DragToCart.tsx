import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { ShoppingBag } from 'lucide-react';
import type { Product } from '../domain/types';
import { getProduct } from '../lib/catalog';
import { useStore } from '../state/store';
import { defaultVariant } from './defaultVariant';

interface DragCtx {
  dragging: Product | null;
  over: boolean;
  start: (p: Product) => void;
  move: (point: { x: number; y: number }) => void;
  /** Returns true when the drop landed on the cart and the item was added. */
  end: (point: { x: number; y: number }) => boolean;
  addDefault: (p: Product) => boolean;
}

const Ctx = createContext<DragCtx | null>(null);

function inside(el: Element | null, { x, y }: { x: number; y: number }) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

export function DragToCartProvider({ children }: { children: ReactNode }) {
  const { addToCart, notify } = useStore();
  const [dragging, setDragging] = useState<Product | null>(null);
  const [over, setOver] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);

  const hit = (point: { x: number; y: number }) => inside(dockRef.current, point) || inside(document.querySelector('[data-cart-target]'), point);

  const addDefault = useCallback(
    (p: Product) => {
      const v = defaultVariant(p);
      if (!v) {
        notify(`${p.name}은(는) 현재 품절입니다.`);
        return false;
      }
      const res = addToCart(p.id, v.colorId, v.size, 1);
      if (!res.ok) {
        notify(res.reason);
        return false;
      }
      const color = p.colors.find((c) => c.id === v.colorId)?.name;
      notify(`${p.name} · ${color} / ${v.size}을(를) 담았습니다. 옵션은 상품 페이지에서 변경할 수 있습니다.`, { label: '장바구니', to: '/cart' });
      return true;
    },
    [addToCart, notify],
  );

  const value: DragCtx = {
    dragging,
    over,
    start: (p) => setDragging(getProduct(p.id) ?? p),
    move: (point) => setOver(hit(point)),
    end: (point) => {
      const p = dragging;
      const ok = !!p && hit(point) && addDefault(p);
      setDragging(null);
      setOver(false);
      return ok;
    },
    addDefault,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      {dragging && (
        <div ref={dockRef} className="cart-dock" data-over={over} aria-hidden="true">
          <ShoppingBag size={28} strokeWidth={1.5} />
          <span>{over ? '놓으면 담깁니다' : '장바구니에 놓기'}</span>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useDragToCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDragToCart must be used inside DragToCartProvider');
  return ctx;
}
