import type { Product } from '../domain/types';
import { asset } from '../lib/format';

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** First in-stock color/size, used when a product is dropped on the cart without choosing options. */
export function defaultVariant(p: Product): { colorId: string; size: string } | null {
  for (const c of p.colors) for (const s of p.sizes) if ((p.stock[c.id]?.[s] ?? 0) > 0) return { colorId: c.id, size: s };
  return null;
}

/** Bump the header bag icon so the user sees where the item went. */
export function pulseCart() {
  const target = document.querySelector<HTMLElement>('[data-cart-target]');
  target?.animate?.([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.2,.7,.2,1)' });
}

/**
 * Animate a thumbnail from `from` (an element or a viewport point) into the header bag.
 * Purely decorative: the cart update happens independently and immediately.
 */
export function flyToCart(from: Element | { x: number; y: number }, imageSrc: string) {
  const target = document.querySelector<HTMLElement>('[data-cart-target]');
  if (!target || prefersReducedMotion() || typeof document.body.animate !== 'function') {
    pulseCart();
    return;
  }
  const start = 'getBoundingClientRect' in from ? from.getBoundingClientRect() : { left: from.x - 40, top: from.y - 50, width: 80, height: 100 };
  const end = target.getBoundingClientRect();
  const size = Math.min(140, Math.max(60, start.width * 0.5));
  const img = document.createElement('img');
  img.src = imageSrc.startsWith('http') ? imageSrc : asset(imageSrc);
  img.alt = '';
  img.setAttribute('aria-hidden', 'true');
  Object.assign(img.style, {
    position: 'fixed',
    left: `${start.left + start.width / 2 - size / 2}px`,
    top: `${start.top + start.height / 2 - (size * 1.25) / 2}px`,
    width: `${size}px`,
    height: `${size * 1.25}px`,
    objectFit: 'cover',
    zIndex: '120',
    pointerEvents: 'none',
    boxShadow: '0 12px 40px rgba(0,0,0,.25)',
  });
  document.body.appendChild(img);
  const dx = end.left + end.width / 2 - (start.left + start.width / 2);
  const dy = end.top + end.height / 2 - (start.top + start.height / 2);
  const anim = img.animate(
    [
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 80}px) scale(.6) rotate(-6deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(.12)`, opacity: 0.2 },
    ],
    { duration: 720, easing: 'cubic-bezier(.5,0,.2,1)' },
  );
  anim.onfinish = () => {
    img.remove();
    pulseCart();
  };
}
