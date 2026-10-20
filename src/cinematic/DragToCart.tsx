import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ShoppingBag } from 'lucide-react';
import type { Product } from '../domain/types';
import { getProduct, primaryImage } from '../lib/catalog';
import { useStore } from '../state/store';
import { defaultVariant, flyToCart } from './flyToCart';

interface DragCtx {
  dragging: Product | null;
  over: boolean;
  start: (p: Product) => void;
  move: (point: { x: number; y: number }) => void;
  /** Returns true when the drop landed on the cart and the item was added. */
  end: (point: { x: number; y: number }) => boolean;
  addDefault: (p: Product, from?: Element | { x: number; y: number }) => boolean;
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
    (p: Product, from?: Element | { x: number; y: number }) => {
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
      notify(`${p.name} (${color} / ${v.size}) 담김 — 옵션은 상세 페이지에서 바꿀 수 있어요.`, { label: '장바구니', to: '/cart' });
      if (from) flyToCart(from, primaryImage(p, v.colorId).src);
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
      const ok = !!p && hit(point) && addDefault(p, point);
      setDragging(null);
      setOver(false);
      return ok;
    },
    addDefault,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <AnimatePresence>
        {dragging && (
          <motion.div
            ref={dockRef}
            className="cart-dock"
            data-over={over}
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: over ? 1.08 : 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            aria-hidden="true"
          >
            <ShoppingBag size={28} strokeWidth={1.5} />
            <span>{over ? '놓으면 담겨요' : '여기로 끌어다 놓기'}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

export function useDragToCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDragToCart must be used inside DragToCartProvider');
  return ctx;
}
