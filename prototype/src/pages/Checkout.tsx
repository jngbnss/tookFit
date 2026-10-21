import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Order, PaymentMethod, ShippingDetails } from '../domain/types';
import { getProduct, primaryImage } from '../lib/catalog';
import { formatKRW } from '../lib/format';
import { generateOrderNumber, METHOD_LABELS, processPayment } from '../lib/payment';
import { formatCardNumber, formatExpiry, digitsOnly, validateCard, validateShipping, type CardInput, type FieldErrors, type ShippingField } from '../lib/validation';
import { track } from '../lib/analytics';
import { useStore } from '../state/store';
import { CouponForm, SummaryRows } from '../components/CartParts';
import { Dialog } from '../components/Overlay';
import { SmartImage } from '../components/SmartImage';
import { usePageMeta } from '../components/usePageMeta';

const EMPTY_SHIPPING: ShippingDetails = { fullName: '', email: '', phone: '', postalCode: '', address: '', city: '', note: '' };
const EMPTY_CARD: CardInput = { number: '', expiry: '', cvc: '', name: '' };

type Status = { kind: 'idle' } | { kind: 'processing' } | { kind: 'declined'; reason: string } | { kind: 'wallet' };

function Field({
  id,
  label,
  error,
  children,
  hint,
  className = '',
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="muted" style={{ fontSize: 12 }}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="error-text">
          {error}
        </p>
      )}
    </div>
  );
}

export default function Checkout() {
  usePageMeta('주문/결제');
  const { cart, totals, coupon, user, addOrder, clearCart } = useStore();
  const navigate = useNavigate();
  const [shipping, setShipping] = useState<ShippingDetails>({ ...EMPTY_SHIPPING, fullName: user?.name ?? '', email: user?.email ?? '' });
  const [agreed, setAgreed] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('card');
  // Card details live only in this component's state. They are never persisted or sent anywhere.
  const [card, setCard] = useState<CardInput>(EMPTY_CARD);
  const [errors, setErrors] = useState<FieldErrors<ShippingField>>({});
  const [cardErrors, setCardErrors] = useState<FieldErrors<keyof CardInput>>({});
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const started = useRef(false);

  useEffect(() => {
    if (!started.current && cart.length) {
      started.current = true;
      track('checkout_start', { items: totals.itemCount, total: totals.total });
    }
  }, [cart.length, totals.itemCount, totals.total]);

  if (cart.length === 0 && status.kind !== 'processing') {
    return (
      <div className="container">
        <div className="empty">
          <h1 className="page-title">주문/결제</h1>
          <p className="muted">장바구니가 비어 있어 주문할 상품이 없습니다.</p>
          <Link to="/shop/all" className="btn btn-primary">
            쇼핑 계속하기
          </Link>
        </div>
      </div>
    );
  }

  const set = (key: keyof ShippingDetails) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setShipping((s) => ({ ...s, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  async function pay() {
    setStatus({ kind: 'processing' });
    const result = await processPayment({ method, amount: totals.total, cardNumber: method === 'card' ? card.number : undefined });
    if (!result.ok) {
      setStatus({ kind: 'declined', reason: result.reason });
      track('payment_failed', { method });
      return;
    }
    const order: Order = {
      id: generateOrderNumber(),
      createdAt: new Date().toISOString(),
      status: '결제 완료',
      lines: cart.map((item) => {
        const p = getProduct(item.productId)!;
        const colorIndex = p.colors.findIndex((c) => c.id === item.colorId);
        return {
          productId: p.id,
          name: p.name,
          image: primaryImage(p, item.colorId).src,
          colorName: p.colors[colorIndex]?.name ?? item.colorId,
          size: item.size,
          quantity: item.quantity,
          unitPrice: p.price,
        };
      }),
      totals,
      coupon,
      shipping: { ...shipping },
      payment: { method: result.method, label: result.label, ...(result.last4 ? { last4: result.last4 } : {}) },
    };
    addOrder(order);
    clearCart();
    setCard(EMPTY_CARD);
    track('payment_success', { method, total: totals.total });
    navigate(`/order/${order.id}`, { replace: true });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const shipErr = validateShipping(shipping, agreed);
    const cErr = method === 'card' ? validateCard(card) : {};
    setErrors(shipErr);
    setCardErrors(cErr);
    const firstKey = Object.keys(shipErr)[0] ?? Object.keys(cErr)[0];
    if (firstKey) {
      const elId = firstKey in cErr && !(firstKey in shipErr) ? `card-${firstKey}` : `ship-${firstKey}`;
      document.getElementById(elId)?.focus();
      return;
    }
    if (method === 'card') void pay();
    else setStatus({ kind: 'wallet' });
  }

  const errorCount = Object.values(errors).filter(Boolean).length + Object.values(cardErrors).filter(Boolean).length;
  const processing = status.kind === 'processing';
  const inputProps = (key: ShippingField) => ({
    id: `ship-${key}`,
    'aria-invalid': !!errors[key],
    'aria-describedby': errors[key] ? `ship-${key}-error` : undefined,
  });
  const cardProps = (key: keyof CardInput) => ({
    id: `card-${key}`,
    'aria-invalid': !!cardErrors[key],
    'aria-describedby': cardErrors[key] ? `card-${key}-error` : undefined,
  });

  return (
    <div className="container" style={{ paddingBottom: 64 }}>
      <header className="catalog-head" style={{ paddingBottom: 16 }}>
        <h1 className="page-title">주문/결제</h1>
      </header>
      <p className="notice notice-strong" role="note" style={{ marginBottom: 24 }}>
        <strong>데모 결제입니다. 실제 결제는 진행되지 않습니다. 샘플 정보만 입력하세요.</strong>
      </p>

      <form className="two-col" onSubmit={submit} noValidate aria-busy={processing}>
        <div>
          {errorCount > 0 && (
            <p className="notice notice-error" role="alert">
              아래 {errorCount}개 항목을 확인해 주세요.
            </p>
          )}
          <section className="checkout-section" aria-labelledby="ship-title">
            <h2 id="ship-title">1. 배송 정보</h2>
            <div className="form-grid">
              <Field id="ship-fullName" label="이름" error={errors.fullName} className="full">
                <input className="input" autoComplete="name" value={shipping.fullName} onChange={set('fullName')} {...inputProps('fullName')} />
              </Field>
              <Field id="ship-email" label="이메일" error={errors.email}>
                <input className="input" type="email" autoComplete="email" value={shipping.email} onChange={set('email')} {...inputProps('email')} />
              </Field>
              <Field id="ship-phone" label="휴대폰 번호" error={errors.phone}>
                <input className="input" type="tel" autoComplete="tel" placeholder="010-1234-5678" value={shipping.phone} onChange={set('phone')} {...inputProps('phone')} />
              </Field>
              <Field id="ship-postalCode" label="우편번호" error={errors.postalCode}>
                <input className="input" inputMode="numeric" autoComplete="postal-code" placeholder="04524" value={shipping.postalCode} onChange={set('postalCode')} {...inputProps('postalCode')} />
              </Field>
              <Field id="ship-city" label="시/도" error={errors.city}>
                <input className="input" autoComplete="address-level2" placeholder="서울" value={shipping.city} onChange={set('city')} {...inputProps('city')} />
              </Field>
              <Field id="ship-address" label="주소" error={errors.address} className="full">
                <input className="input" autoComplete="street-address" placeholder="중구 샘플로 123" value={shipping.address} onChange={set('address')} {...inputProps('address')} />
              </Field>
              <Field id="ship-note" label="배송 메모 (선택)" className="full">
                <textarea className="textarea" value={shipping.note} onChange={set('note')} id="ship-note" placeholder="예: 경비실에 맡겨 주세요" />
              </Field>
            </div>
          </section>

          <section className="checkout-section" aria-labelledby="pay-title">
            <h2 id="pay-title">2. 결제 수단</h2>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="sr-only">결제 수단</legend>
              <div className="pay-methods">
                {(['card', 'kakaopay', 'naverpay'] as PaymentMethod[]).map((m) => (
                  <label key={m} className="pay-method">
                    <input type="radio" name="method" value={m} checked={method === m} onChange={() => { setMethod(m); setStatus({ kind: 'idle' }); }} />
                    <span>{METHOD_LABELS[m]}</span>
                    {m === 'kakaopay' && <span className="wallet-mark wallet-kakao" aria-hidden="true">pay</span>}
                    {m === 'naverpay' && <span className="wallet-mark wallet-naver" aria-hidden="true">N pay</span>}
                  </label>
                ))}
              </div>
            </fieldset>

            {method === 'card' && (
              <div className="form-grid" style={{ marginTop: 16 }}>
                <Field id="card-number" label="카드 번호" error={cardErrors.number} hint="테스트: 4242 4242 4242 4242는 결제 성공, 4000 0000 0000 0002는 결제 거절." className="full">
                  <input
                    className="input"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="1234 5678 9012 3456"
                    value={card.number}
                    onChange={(e) => setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))}
                    {...cardProps('number')}
                    aria-describedby={cardErrors.number ? 'card-number-error' : 'card-number-hint'}
                  />
                </Field>
                <Field id="card-expiry" label="유효기간 (MM/YY)" error={cardErrors.expiry}>
                  <input className="input" inputMode="numeric" autoComplete="off" placeholder="12/29" value={card.expiry} onChange={(e) => setCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))} {...cardProps('expiry')} />
                </Field>
                <Field id="card-cvc" label="CVC" error={cardErrors.cvc}>
                  <input className="input" inputMode="numeric" autoComplete="off" placeholder="123" value={card.cvc} onChange={(e) => setCard((c) => ({ ...c, cvc: digitsOnly(e.target.value).slice(0, 4) }))} {...cardProps('cvc')} />
                </Field>
                <Field id="card-name" label="카드 소유자 이름" error={cardErrors.name} className="full">
                  <input className="input" autoComplete="off" value={card.name} onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))} {...cardProps('name')} />
                </Field>
              </div>
            )}
            {method !== 'card' && (
              <p className="muted" style={{ marginTop: 16, fontSize: 14 }}>
                시뮬레이션 {METHOD_LABELS[method]} 창에서 결제를 승인합니다. 외부 서비스에 연결하지 않습니다.
              </p>
            )}
          </section>

          <section className="checkout-section" aria-label="약관 동의">
            <label className="checkbox">
              <input
                type="checkbox"
                id="ship-terms"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked);
                  if (errors.terms) setErrors((er) => ({ ...er, terms: undefined }));
                }}
                aria-invalid={!!errors.terms}
                aria-describedby={errors.terms ? 'ship-terms-error' : undefined}
              />
              <span>
                데모 스토어임을 이해했으며 <Link to="/terms" className="link-underline">데모 이용약관</Link> 및{' '}
                <Link to="/privacy" className="link-underline">개인정보처리방침</Link>에 동의합니다.
              </span>
            </label>
            {errors.terms && (
              <p id="ship-terms-error" className="error-text" style={{ marginTop: 6 }}>
                {errors.terms}
              </p>
            )}
          </section>

          {status.kind === 'declined' && (
            <div className="notice notice-error" role="alert" style={{ marginTop: 16 }}>
              <p>
                <strong>결제가 거절되었습니다.</strong> {status.reason}
              </p>
              <p style={{ marginTop: 6 }}>카드 정보를 확인하거나 다른 결제 수단을 선택한 뒤 다시 시도해 주세요.</p>
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <button type="submit" className="btn btn-primary btn-block" disabled={processing}>
              {processing ? '결제 처리 중…' : status.kind === 'declined' ? `다시 결제하기 · ${formatKRW(totals.total)}` : `${formatKRW(totals.total)} 결제하기`}
            </button>
            {processing && (
              <p role="status" className="muted" style={{ marginTop: 8, textAlign: 'center' }}>
                시뮬레이션 결제를 처리하고 있습니다…
              </p>
            )}
          </div>
        </div>

        <aside className="summary" aria-label="주문 요약">
          <h2 style={{ fontSize: 14, letterSpacing: '0.14em', textTransform: 'uppercase' }}>주문 요약</h2>
          <ul>
            {cart.map((item) => {
              const p = getProduct(item.productId)!;
              const color = p.colors.find((c) => c.id === item.colorId);
              const img = primaryImage(p, item.colorId);
              return (
                <li key={item.key} className="line" style={{ gridTemplateColumns: '56px 1fr' }}>
                  <SmartImage src={img.src} alt={img.alt} />
                  <div className="line-info">
                    <span>{p.name}</span>
                    <span className="line-meta">
                      {color?.name} · {item.size} · 수량 {item.quantity}
                    </span>
                    <span>{formatKRW(p.price * item.quantity)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
          <CouponForm />
          <SummaryRows totals={totals} coupon={coupon} />
          <Link to="/cart" className="btn-text">
            장바구니 수정
          </Link>
        </aside>
      </form>

      <Dialog open={status.kind === 'wallet'} onClose={() => setStatus({ kind: 'idle' })} title={`${METHOD_LABELS[method]} (시뮬레이션)`}>
        <div className="wallet-dialog">
          <span className={`wallet-mark ${method === 'kakaopay' ? 'wallet-kakao' : 'wallet-naver'}`} style={{ margin: '0 auto', fontSize: 16, padding: '6px 14px' }} aria-hidden="true">
            {method === 'kakaopay' ? 'pay' : 'N pay'}
          </span>
          <p>
            TUK FIT에 <strong>{formatKRW(totals.total)}</strong>을 결제할까요?
          </p>
          <p className="muted" style={{ fontSize: 13 }}>
            시뮬레이션 승인 화면입니다. 앱이 열리거나 실제 돈이 오가지 않습니다.
          </p>
          <button type="button" className="btn btn-primary btn-block" data-autofocus onClick={() => void pay()}>
            결제 승인
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={() => {
              setStatus({ kind: 'declined', reason: `${METHOD_LABELS[method]} 결제가 취소되었습니다.` });
              track('payment_failed', { method, cancelled: true });
            }}
          >
            취소
          </button>
        </div>
      </Dialog>
      {processing && (
        <div className="overlay" style={{ display: 'grid', placeItems: 'center' }} aria-hidden="true">
          <div style={{ background: 'var(--bg)', padding: 32, display: 'grid', gap: 12, textAlign: 'center' }}>
            <div className="spinner" />
            <p>결제 처리 중…</p>
          </div>
        </div>
      )}
    </div>
  );
}
