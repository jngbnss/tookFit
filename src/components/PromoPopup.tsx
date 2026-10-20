import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { asset } from '../lib/format';
import { readJSON, STORAGE_KEYS, writeJSON } from '../lib/storage';
import { useFocusTrap } from './useFocusTrap';

const SLIDES = [
  {
    eyebrow: '배송 혜택',
    title: '₩100,000 이상 무료배송',
    body: '모든 주문 14일 이내 무료 반품.',
    cta: { label: '신상품 보러가기', to: '/shop/new-arrivals' },
    image: 'images/editorial/editorial-03.webp',
    alt: '따뜻한 스튜디오의 네이비 다운 패딩과 크림 윈터 스니커즈',
  },
  {
    eyebrow: '웰컴 쿠폰',
    title: 'TUK10 코드로 10% 할인',
    body: '최대 ₩20,000 할인. 장바구니나 주문서에서 입력하세요.',
    cta: { label: '아우터 보러가기', to: '/shop/outerwear' },
    image: 'images/editorial/hero-mobile-01.webp',
    alt: '스튜디오의 블랙 울 코트, 크림 케이블 니트, 블랙 부츠',
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
        <div className="promo-dots" role="group" aria-label="혜택 선택">
          {SLIDES.map((s, i) => (
            <button key={s.title} type="button" aria-pressed={i === index} aria-label={`혜택 ${i + 1} / ${SLIDES.length}`} onClick={() => setIndex(i)} />
          ))}
        </div>
        <button type="button" className="btn btn-primary btn-block" onClick={close} data-autofocus>
          닫기
        </button>
        <label className="checkbox promo-today">
          <input type="checkbox" checked={hideToday} onChange={(e) => setHideToday(e.target.checked)} />
          오늘 하루 보지 않기
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
        ₩100,000 이상 무료배송 · 쿠폰 TUK10 10% 할인 · <Link to="/shipping-returns">14일 무료 반품</Link>
      </span>
      <button
        type="button"
        className="announcement-close"
        aria-label="공지 닫기"
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
