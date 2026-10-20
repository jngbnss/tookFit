import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { asset } from '../lib/format';
import { readJSON, STORAGE_KEYS, writeJSON } from '../lib/storage';
import { useFocusTrap } from './useFocusTrap';

const SLIDES = [
  {
    eyebrow: 'Members & guests',
    title: 'Free shipping over ₩100,000',
    body: 'Plus free 14-day returns on every order.',
    cta: { label: 'Shop new arrivals', to: '/shop/new-arrivals' },
    image: 'images/editorial/editorial-03.webp',
    alt: 'Navy down puffer jacket and cream winter sneakers in a warm studio',
  },
  {
    eyebrow: 'Welcome offer',
    title: '10% off with code TOOK10',
    body: 'Up to ₩20,000 off your order. Apply it in your bag or at checkout.',
    cta: { label: 'Shop outerwear', to: '/shop/outerwear' },
    image: 'images/editorial/hero-mobile-01.webp',
    alt: 'Black wool overcoat, cream cable knit, and black boots in a studio',
  },
];

function todayKey(now = new Date()) {
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

/** Dismissed for the current calendar day when "Don't show again today" is checked. */
export function isPromoHidden(now = new Date()) {
  return readJSON<string | null>(STORAGE_KEYS.promoHiddenOn, null) === todayKey(now);
}

export function PromoPopup() {
  const [open, setOpen] = useState(() => !isPromoHidden());
  const [index, setIndex] = useState(0);
  const [hideToday, setHideToday] = useState(false);
  const id = useId();

  function close() {
    if (hideToday) writeJSON(STORAGE_KEYS.promoHiddenOn, todayKey());
    setOpen(false);
  }

  const ref = useFocusTrap<HTMLDivElement>(open, close);

  useEffect(() => {
    if (!open || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 5000);
    return () => window.clearInterval(t);
  }, [open]);

  if (!open) return null;
  const slide = SLIDES[index];

  return (
    <>
      <div className="overlay" onClick={close} aria-hidden="true" />
      <div ref={ref} className="promo" role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1}>
        <div className="promo-media">
          <img src={asset(slide.image)} alt={slide.alt} width={1024} height={1280} />
        </div>
        <div className="promo-copy" aria-live="polite">
          <p className="eyebrow">{slide.eyebrow}</p>
          <h2 id={id}>{slide.title}</h2>
          <p className="muted">{slide.body}</p>
          <Link to={slide.cta.to} className="link-underline" onClick={close}>
            {slide.cta.label}
          </Link>
        </div>
        <div className="promo-dots" role="group" aria-label="Choose offer">
          {SLIDES.map((s, i) => (
            <button key={s.title} type="button" aria-pressed={i === index} aria-label={`Offer ${i + 1} of ${SLIDES.length}`} onClick={() => setIndex(i)} />
          ))}
        </div>
        <button type="button" className="btn btn-primary btn-block" onClick={close} data-autofocus>
          Close
        </button>
        <label className="checkbox promo-today">
          <input type="checkbox" checked={hideToday} onChange={(e) => setHideToday(e.target.checked)} />
          Don’t show again today
        </label>
      </div>
    </>
  );
}

export function AnnouncementBar() {
  const [hidden, setHidden] = useState(() => {
    try {
      return window.sessionStorage.getItem('tookfit.announcement.hidden') === '1';
    } catch {
      return false;
    }
  });
  if (hidden) return null;
  return (
    <div className="announcement">
      <span>
        Free shipping over ₩100,000 · Use code TOOK10 for 10% off · <Link to="/shipping-returns">Free 14-day returns</Link>
      </span>
      <button
        type="button"
        className="announcement-close"
        aria-label="Dismiss announcement"
        onClick={() => {
          setHidden(true);
          try {
            window.sessionStorage.setItem('tookfit.announcement.hidden', '1');
          } catch {
            // ignore unavailable storage
          }
        }}
      >
        ×
      </button>
    </div>
  );
}
