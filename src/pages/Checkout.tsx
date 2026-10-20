import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Order, PaymentMethod, ShippingDetails } from '../domain/types';
import { getProduct } from '../lib/catalog';
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
  usePageMeta('Checkout');
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
          <h1 className="page-title">Checkout</h1>
          <p className="muted">Your bag is empty, so there’s nothing to check out yet.</p>
          <Link to="/shop/all" className="btn btn-primary">
            Continue shopping
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
      status: 'Processing',
      lines: cart.map((item) => {
        const p = getProduct(item.productId)!;
        const colorIndex = p.colors.findIndex((c) => c.id === item.colorId);
        return {
          productId: p.id,
          name: p.name,
          image: p.images[colorIndex === 1 ? 1 : 0].src,
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
        <h1 className="page-title">Checkout</h1>
      </header>
      <p className="notice notice-strong" role="note" style={{ marginBottom: 24 }}>
        <strong>Demo checkout. No real payment will be processed. Use sample information only.</strong>
      </p>

      <form className="two-col" onSubmit={submit} noValidate aria-busy={processing}>
        <div>
          {errorCount > 0 && (
            <p className="notice notice-error" role="alert">
              Please fix {errorCount} {errorCount === 1 ? 'field' : 'fields'} below.
            </p>
          )}
          <section className="checkout-section" aria-labelledby="ship-title">
            <h2 id="ship-title">1. Shipping details</h2>
            <div className="form-grid">
              <Field id="ship-fullName" label="Full name" error={errors.fullName} className="full">
                <input className="input" autoComplete="name" value={shipping.fullName} onChange={set('fullName')} {...inputProps('fullName')} />
              </Field>
              <Field id="ship-email" label="Email" error={errors.email}>
                <input className="input" type="email" autoComplete="email" value={shipping.email} onChange={set('email')} {...inputProps('email')} />
              </Field>
              <Field id="ship-phone" label="Phone" error={errors.phone}>
                <input className="input" type="tel" autoComplete="tel" placeholder="010-1234-5678" value={shipping.phone} onChange={set('phone')} {...inputProps('phone')} />
              </Field>
              <Field id="ship-postalCode" label="Postal code" error={errors.postalCode}>
                <input className="input" inputMode="numeric" autoComplete="postal-code" placeholder="04524" value={shipping.postalCode} onChange={set('postalCode')} {...inputProps('postalCode')} />
              </Field>
              <Field id="ship-city" label="City" error={errors.city}>
                <input className="input" autoComplete="address-level2" placeholder="Seoul" value={shipping.city} onChange={set('city')} {...inputProps('city')} />
              </Field>
              <Field id="ship-address" label="Address" error={errors.address} className="full">
                <input className="input" autoComplete="street-address" placeholder="123 Sample-ro, Jung-gu" value={shipping.address} onChange={set('address')} {...inputProps('address')} />
              </Field>
              <Field id="ship-note" label="Delivery note (optional)" className="full">
                <textarea className="textarea" value={shipping.note} onChange={set('note')} id="ship-note" placeholder="e.g. Leave at the front desk" />
              </Field>
            </div>
          </section>

          <section className="checkout-section" aria-labelledby="pay-title">
            <h2 id="pay-title">2. Payment</h2>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="sr-only">Payment method</legend>
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
                <Field id="card-number" label="Card number" error={cardErrors.number} hint="Test: 4242 4242 4242 4242 succeeds, 4000 0000 0000 0002 is declined." className="full">
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
                <Field id="card-expiry" label="Expiry (MM/YY)" error={cardErrors.expiry}>
                  <input className="input" inputMode="numeric" autoComplete="off" placeholder="12/29" value={card.expiry} onChange={(e) => setCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))} {...cardProps('expiry')} />
                </Field>
                <Field id="card-cvc" label="CVC" error={cardErrors.cvc}>
                  <input className="input" inputMode="numeric" autoComplete="off" placeholder="123" value={card.cvc} onChange={(e) => setCard((c) => ({ ...c, cvc: digitsOnly(e.target.value).slice(0, 4) }))} {...cardProps('cvc')} />
                </Field>
                <Field id="card-name" label="Name on card" error={cardErrors.name} className="full">
                  <input className="input" autoComplete="off" value={card.name} onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))} {...cardProps('name')} />
                </Field>
              </div>
            )}
            {method !== 'card' && (
              <p className="muted" style={{ marginTop: 16, fontSize: 14 }}>
                You’ll confirm the payment in a simulated {METHOD_LABELS[method]} window. No external service is contacted.
              </p>
            )}
          </section>

          <section className="checkout-section" aria-label="Terms">
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
                I understand this is a demo store and agree to the <Link to="/terms" className="link-underline">demo terms</Link> and{' '}
                <Link to="/privacy" className="link-underline">privacy notice</Link>.
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
                <strong>Payment declined.</strong> {status.reason}
              </p>
              <p style={{ marginTop: 6 }}>Check your card details or choose another payment method, then try again.</p>
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <button type="submit" className="btn btn-primary btn-block" disabled={processing}>
              {processing ? 'Processing payment…' : status.kind === 'declined' ? `Retry payment · ${formatKRW(totals.total)}` : `Pay ${formatKRW(totals.total)}`}
            </button>
            {processing && (
              <p role="status" className="muted" style={{ marginTop: 8, textAlign: 'center' }}>
                Processing your simulated payment…
              </p>
            )}
          </div>
        </div>

        <aside className="summary" aria-label="Order summary">
          <h2 style={{ fontSize: 14, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Order summary</h2>
          <ul>
            {cart.map((item) => {
              const p = getProduct(item.productId)!;
              const color = p.colors.find((c) => c.id === item.colorId);
              const idx = p.colors.indexOf(color!) === 1 ? 1 : 0;
              return (
                <li key={item.key} className="line" style={{ gridTemplateColumns: '56px 1fr' }}>
                  <SmartImage src={p.images[idx].src} alt={p.images[idx].alt} />
                  <div className="line-info">
                    <span>{p.name}</span>
                    <span className="line-meta">
                      {color?.name} · {item.size} · Qty {item.quantity}
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
            Edit bag
          </Link>
        </aside>
      </form>

      <Dialog open={status.kind === 'wallet'} onClose={() => setStatus({ kind: 'idle' })} title={`${METHOD_LABELS[method]} (simulated)`}>
        <div className="wallet-dialog">
          <span className={`wallet-mark ${method === 'kakaopay' ? 'wallet-kakao' : 'wallet-naver'}`} style={{ margin: '0 auto', fontSize: 16, padding: '6px 14px' }} aria-hidden="true">
            {method === 'kakaopay' ? 'pay' : 'N pay'}
          </span>
          <p>
            Approve a payment of <strong>{formatKRW(totals.total)}</strong> to T.O.O.K FIT?
          </p>
          <p className="muted" style={{ fontSize: 13 }}>
            This is a simulated confirmation screen. No app is opened and no money moves.
          </p>
          <button type="button" className="btn btn-primary btn-block" data-autofocus onClick={() => void pay()}>
            Approve payment
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={() => {
              setStatus({ kind: 'declined', reason: `${METHOD_LABELS[method]} payment was cancelled.` });
              track('payment_failed', { method, cancelled: true });
            }}
          >
            Cancel
          </button>
        </div>
      </Dialog>
      {processing && (
        <div className="overlay" style={{ display: 'grid', placeItems: 'center' }} aria-hidden="true">
          <div style={{ background: 'var(--bg)', padding: 32, display: 'grid', gap: 12, textAlign: 'center' }}>
            <div className="spinner" />
            <p>Processing payment…</p>
          </div>
        </div>
      )}
    </div>
  );
}
