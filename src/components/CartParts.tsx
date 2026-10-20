import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { CartItem, CartTotals } from '../domain/types';
import { getProduct } from '../lib/catalog';
import { formatKRW } from '../lib/format';
import { COUPON_CODE, FREE_SHIPPING_THRESHOLD, maxQuantity } from '../lib/pricing';
import { useStore } from '../state/store';
import { SmartImage } from './SmartImage';

export function CartLine({ item, compact = false, onNavigate }: { item: CartItem; compact?: boolean; onNavigate?: () => void }) {
  const { setQuantity, removeFromCart, notify } = useStore();
  const product = getProduct(item.productId);
  if (!product) return null;
  const color = product.colors.find((c) => c.id === item.colorId);
  const max = maxQuantity(product, item.colorId, item.size);
  const imgIndex = product.colors.findIndex((c) => c.id === item.colorId) === 1 ? 1 : 0;
  const label = `${product.name}, ${color?.name}, size ${item.size}`;
  return (
    <li className="line">
      <Link to={`/product/${product.slug}`} onClick={onNavigate} aria-hidden="true" tabIndex={-1}>
        <SmartImage src={product.images[imgIndex].src} alt={product.images[imgIndex].alt} />
      </Link>
      <div className="line-info">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <Link to={`/product/${product.slug}`} onClick={onNavigate}>
            {product.name}
          </Link>
          <span>{formatKRW(product.price * item.quantity)}</span>
        </div>
        <p className="line-meta">
          {color?.name} · Size {item.size}
          {!compact && <> · {formatKRW(product.price)} each</>}
        </p>
        <div className="line-actions">
          <div className="qty qty-sm" role="group" aria-label={`Quantity for ${label}`}>
            <button type="button" aria-label={`Decrease quantity of ${label}`} disabled={item.quantity <= 1} onClick={() => setQuantity(item.key, item.quantity - 1)}>
              −
            </button>
            <span aria-live="polite">{item.quantity}</span>
            <button type="button" aria-label={`Increase quantity of ${label}`} disabled={item.quantity >= max} onClick={() => setQuantity(item.key, item.quantity + 1)}>
              +
            </button>
          </div>
          <button
            type="button"
            className="btn-text"
            onClick={() => {
              removeFromCart(item.key);
              notify(`${product.name} removed from your bag.`);
            }}
            aria-label={`Remove ${label}`}
          >
            Remove
          </button>
        </div>
        {item.quantity >= max && <p className="line-meta">Maximum available quantity reached.</p>}
      </div>
    </li>
  );
}

export function FreeShippingProgress({ subtotal }: { subtotal: number }) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  return (
    <div className="ship-progress">
      <p>{remaining > 0 ? <>Add {formatKRW(remaining)} more for free shipping.</> : <>You’ve unlocked free standard shipping.</>}</p>
      <div className="bar" role="progressbar" aria-label="Progress to free shipping" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function CouponForm() {
  const { coupon, applyCoupon, removeCoupon } = useStore();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      setMessage({ ok: false, text: 'Enter a coupon code.' });
      return;
    }
    const ok = applyCoupon(code);
    setMessage(ok ? { ok: true, text: 'Coupon applied: 10% off, up to ₩20,000.' } : { ok: false, text: `“${code}” isn’t a valid code. Try ${COUPON_CODE}.` });
    if (ok) setCode('');
  }

  if (coupon) {
    return (
      <div className="summary-row" style={{ alignItems: 'center' }}>
        <span>
          Coupon <strong>{coupon}</strong> applied
        </span>
        <button
          type="button"
          className="btn-text"
          onClick={() => {
            removeCoupon();
            setMessage(null);
          }}
        >
          Remove
        </button>
      </div>
    );
  }
  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="coupon" className="sr-only">
        Coupon code
      </label>
      <div className="coupon-form">
        <input id="coupon" className="input" placeholder="Coupon code" value={code} onChange={(e) => setCode(e.target.value)} aria-describedby={message ? 'coupon-msg' : undefined} aria-invalid={message ? !message.ok : undefined} />
        <button type="submit" className="btn btn-secondary">
          Apply
        </button>
      </div>
      {message && (
        <p id="coupon-msg" className={message.ok ? 'muted' : 'error-text'} role="status" style={{ marginTop: 6, fontSize: 13 }}>
          {message.text}
        </p>
      )}
    </form>
  );
}

export function SummaryRows({ totals, coupon }: { totals: CartTotals; coupon: string | null }) {
  return (
    <>
      <div className="summary-row">
        <span>Subtotal ({totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'})</span>
        <span>{formatKRW(totals.subtotal)}</span>
      </div>
      {totals.discount > 0 && (
        <div className="summary-row">
          <span>Discount{coupon ? ` (${coupon})` : ''}</span>
          <span>−{formatKRW(totals.discount)}</span>
        </div>
      )}
      <div className="summary-row">
        <span>Shipping</span>
        <span>{totals.shipping === 0 ? 'Free' : formatKRW(totals.shipping)}</span>
      </div>
      <div className="summary-row summary-total">
        <span>Total</span>
        <span>{formatKRW(totals.total)}</span>
      </div>
      <p className="muted" style={{ fontSize: 12 }}>
        All prices include VAT.
      </p>
    </>
  );
}
