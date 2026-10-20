import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { CartItem, CartTotals } from '../domain/types';
import { getProduct, primaryImage } from '../lib/catalog';
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
  const img = primaryImage(product, item.colorId);
  const label = `${product.name}, ${color?.name}, 사이즈 ${item.size}`;
  return (
    <li className="line">
      <Link to={`/product/${product.slug}`} onClick={onNavigate} aria-hidden="true" tabIndex={-1}>
        <SmartImage src={img.src} alt={img.alt} />
      </Link>
      <div className="line-info">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <Link to={`/product/${product.slug}`} onClick={onNavigate}>
            {product.name}
          </Link>
          <span>{formatKRW(product.price * item.quantity)}</span>
        </div>
        <p className="line-meta">
          {color?.name} · 사이즈 {item.size}
          {!compact && <> · 개당 {formatKRW(product.price)}</>}
        </p>
        <div className="line-actions">
          <div className="qty qty-sm" role="group" aria-label={`${label} 수량`}>
            <button type="button" aria-label={`${label} 수량 줄이기`} disabled={item.quantity <= 1} onClick={() => setQuantity(item.key, item.quantity - 1)}>
              −
            </button>
            <span aria-live="polite">{item.quantity}</span>
            <button type="button" aria-label={`${label} 수량 늘리기`} disabled={item.quantity >= max} onClick={() => setQuantity(item.key, item.quantity + 1)}>
              +
            </button>
          </div>
          <button
            type="button"
            className="btn-text"
            onClick={() => {
              removeFromCart(item.key);
              notify(`${product.name}을(를) 장바구니에서 삭제했습니다.`);
            }}
            aria-label={`${label} 삭제`}
          >
            삭제
          </button>
        </div>
        {item.quantity >= max && <p className="line-meta">구매 가능한 최대 수량입니다.</p>}
      </div>
    </li>
  );
}

export function FreeShippingProgress({ subtotal }: { subtotal: number }) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  return (
    <div className="ship-progress">
      <p>{remaining > 0 ? <>{formatKRW(remaining)} 더 담으면 무료배송!</> : <>무료배송 혜택이 적용되었습니다.</>}</p>
      <div className="bar" role="progressbar" aria-label="무료배송까지 진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
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
      setMessage({ ok: false, text: '쿠폰 코드를 입력해 주세요.' });
      return;
    }
    const ok = applyCoupon(code);
    setMessage(ok ? { ok: true, text: '쿠폰 적용 완료: 10% 할인 (최대 ₩20,000)' } : { ok: false, text: `“${code}”은(는) 유효하지 않은 코드입니다. ${COUPON_CODE}를 사용해 보세요.` });
    if (ok) setCode('');
  }

  if (coupon) {
    return (
      <div className="summary-row" style={{ alignItems: 'center' }}>
        <span>
          쿠폰 <strong>{coupon}</strong> 적용됨
        </span>
        <button
          type="button"
          className="btn-text"
          onClick={() => {
            removeCoupon();
            setMessage(null);
          }}
        >
          삭제
        </button>
      </div>
    );
  }
  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="coupon" className="sr-only">
        쿠폰 코드
      </label>
      <div className="coupon-form">
        <input id="coupon" className="input" placeholder="쿠폰 코드" value={code} onChange={(e) => setCode(e.target.value)} aria-describedby={message ? 'coupon-msg' : undefined} aria-invalid={message ? !message.ok : undefined} />
        <button type="submit" className="btn btn-secondary">
          적용
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
        <span>상품 금액 ({totals.itemCount}개)</span>
        <span>{formatKRW(totals.subtotal)}</span>
      </div>
      {totals.discount > 0 && (
        <div className="summary-row">
          <span>할인{coupon ? ` (${coupon})` : ''}</span>
          <span>−{formatKRW(totals.discount)}</span>
        </div>
      )}
      <div className="summary-row">
        <span>배송비</span>
        <span>{totals.shipping === 0 ? '무료' : formatKRW(totals.shipping)}</span>
      </div>
      <div className="summary-row summary-total">
        <span>총 결제 금액</span>
        <span>{formatKRW(totals.total)}</span>
      </div>
      <p className="muted" style={{ fontSize: 12 }}>
        모든 가격은 부가세 포함입니다.
      </p>
    </>
  );
}
