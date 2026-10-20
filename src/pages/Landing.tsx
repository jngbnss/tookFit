import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { ArrowDown, ArrowRight, MousePointerClick } from 'lucide-react';
import { CATEGORIES, PRODUCTS } from '../data/products';
import { MOODS } from '../data/moods';
import type { Product } from '../domain/types';
import { getProduct, primaryImage } from '../lib/catalog';
import { asset, formatKRW } from '../lib/format';
import { discountPercent } from '../lib/pricing';
import { moodStyle, useMood } from '../cinematic/MoodContext';
import { Newsletter } from '../components/Newsletter';
import { RecentlyViewed } from '../components/RecentlyViewed';
import { usePageMeta } from '../components/usePageMeta';

const ease = [0.2, 0.7, 0.2, 1] as const;

function moodProducts(ids: string[]) {
  return ids.map(getProduct).filter((p): p is Product => !!p);
}

function MoodSwitcher({ compact = false }: { compact?: boolean }) {
  const { mood, setMood } = useMood();
  return (
    <div className={`mood-switcher ${compact ? 'compact' : ''}`} role="radiogroup" aria-label="분위기 선택">
      {MOODS.map((m) => (
        <button key={m.id} type="button" role="radio" aria-checked={m.id === mood.id} onClick={() => setMood(m.id)} style={{ fontFamily: m.font }}>
          {m.id === mood.id && <motion.span layoutId="mood-pill" className="mood-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
          <span className="relative">{m.label}</span>
        </button>
      ))}
    </div>
  );
}

function Hero() {
  const { mood } = useMood();
  const reduce = useReducedMotion();
  const hero = moodProducts(mood.productIds)[0];
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 20 });
  const sy = useSpring(my, { stiffness: 120, damping: 20 });
  const rotY = useTransform(sx, [-1, 1], [-10, 10]);
  const rotX = useTransform(sy, [-1, 1], [8, -8]);
  const imgX = useTransform(sx, [-1, 1], [-24, 24]);
  const imgY = useTransform(sy, [-1, 1], [-18, 18]);
  const typeX = useTransform(sx, [-1, 1], [40, -40]);
  const typeY = useTransform(sy, [-1, 1], [20, -20]);

  function onMove(e: ReactPointerEvent<HTMLElement>) {
    if (reduce || e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  }

  const img = primaryImage(hero);
  const pct = discountPercent(hero);

  return (
    <section className="cine-hero" onPointerMove={onMove} onPointerLeave={() => { mx.set(0); my.set(0); }} aria-labelledby="cine-title">
      <motion.p className="cine-giant" style={{ x: typeX, y: typeY, fontFamily: mood.font }} aria-hidden="true">
        TUK FIT
      </motion.p>

      <div className="cine-hero-copy">
        <motion.p className="cine-eyebrow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          2026 F/W — {mood.label}
        </motion.p>
        <AnimatePresence mode="wait">
          <motion.h1
            key={mood.id}
            id="cine-title"
            className="cine-title"
            initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -30, filter: 'blur(8px)' }}
            transition={{ duration: 0.7, ease }}
          >
            {mood.tagline}
          </motion.h1>
        </AnimatePresence>
        <p className="cine-sub">{mood.description}</p>
        <div className="cine-ctas">
          <Link to="/explore" className="cine-btn primary">
            컬렉션 둘러보기 <ArrowRight size={16} />
          </Link>
          <Link to={`/product/${hero.slug}`} className="cine-btn">
            대표 상품 보기
          </Link>
        </div>
      </div>

      <motion.div className="cine-stage" style={{ rotateX: rotX, rotateY: rotY }}>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={hero.id}
            className="cine-product"
            style={{ x: imgX, y: imgY }}
            initial={{ opacity: 0, scale: 0.85, rotate: -4 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.05, rotate: 3 }}
            transition={{ duration: 0.8, ease }}
          >
            <Link to={`/product/${hero.slug}`} data-cursor="view" data-cursor-label="VIEW" aria-label={`${hero.name} 상세 보기`}>
              <img src={asset(img.src)} alt={img.alt} width={1024} height={1280} fetchPriority="high" />
            </Link>
            <div className="cine-tag">
              <span>{hero.name}</span>
              <span>
                {formatKRW(hero.price)}
                {pct > 0 && <em> −{pct}%</em>}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <div className="cine-hero-foot">
        <MoodSwitcher />
        <span className="cine-scroll-hint" aria-hidden="true">
          <ArrowDown size={14} /> SCROLL
        </span>
      </div>
    </section>
  );
}

function ScrollStory() {
  const { mood } = useMood();
  const reduce = useReducedMotion();
  const items = moodProducts(mood.productIds).slice(0, 4);
  const ref = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  useMotionValueEvent(scrollYProgress, 'change', (v) => setIndex(Math.min(items.length - 1, Math.max(0, Math.floor(v * items.length)))));
  const bar = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  if (reduce) {
    return (
      <section className="container section" aria-label="이번 시즌의 이야기">
        <ul className="grid">
          {items.map((p) => (
            <li key={p.id}>
              <Link to={`/product/${p.slug}`}>
                <img src={asset(primaryImage(p).src)} alt={primaryImage(p).alt} loading="lazy" width={1024} height={1280} />
                <p>{p.name}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const p = items[index];
  return (
    <section ref={ref} className="story" style={{ height: `${items.length * 90 + 40}vh` }} aria-label="이번 시즌의 이야기">
      <div className="story-sticky">
        <div className="story-media">
          <AnimatePresence mode="popLayout">
            <motion.img
              key={p.id}
              src={asset(primaryImage(p).src)}
              alt={primaryImage(p).alt}
              width={1024}
              height={1280}
              initial={{ opacity: 0, scale: 1.08, clipPath: 'inset(12% 12% 12% 12%)' }}
              animate={{ opacity: 1, scale: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.8, ease }}
            />
          </AnimatePresence>
        </div>
        <div className="story-copy">
          <p className="cine-eyebrow">
            {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
          </p>
          <AnimatePresence mode="wait">
            <motion.div key={p.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5, ease }}>
              <h2>{p.name}</h2>
              <p className="story-desc">{p.description}</p>
              <p className="story-price">{formatKRW(p.price)}</p>
              <Link to={`/product/${p.slug}`} className="cine-btn">
                자세히 보기 <ArrowRight size={16} />
              </Link>
            </motion.div>
          </AnimatePresence>
          <div className="story-progress" aria-hidden="true">
            <motion.span style={{ width: bar }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryEntrance() {
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  return (
    <section className="cat-entrance container" aria-labelledby="cat-entrance-title">
      <div className="section-head">
        <h2 id="cat-entrance-title">카테고리</h2>
        <Link to="/explore?view=list" className="link-underline">
          목록으로 보기
        </Link>
      </div>
      <ul className="cat-panels">
        {CATEGORIES.map((c, i) => {
          const p = PRODUCTS.find((x) => x.category === c.slug)!;
          return (
            <motion.li
              key={c.slug}
              className="cat-panel"
              data-active={i === active}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.6, delay: i * 0.06, ease }}
              layout
            >
              <button type="button" onClick={() => navigate(`/explore?category=${c.slug}`)} data-cursor="view" data-cursor-label="ENTER" aria-label={`${c.label} 탐색하기`}>
                <img src={asset(primaryImage(p).src)} alt="" loading="lazy" width={1024} height={1280} />
                <span className="cat-panel-label">
                  <span className="cat-num">{String(i + 1).padStart(2, '0')}</span>
                  {c.label}
                </span>
                <span className="cat-panel-blurb">{c.blurb}</span>
              </button>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}

function MoodIndex() {
  const { setMood } = useMood();
  const navigate = useNavigate();
  const [hover, setHover] = useState<number | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 30 });
  const sy = useSpring(y, { stiffness: 300, damping: 30 });
  return (
    <section
      className="mood-index"
      aria-labelledby="mood-index-title"
      onPointerMove={(e) => {
        x.set(e.clientX);
        y.set(e.clientY);
      }}
    >
      <div className="container">
        <h2 id="mood-index-title" className="cine-eyebrow">
          Shop by Mood
        </h2>
        <ul>
          {MOODS.map((m, i) => (
            <li key={m.id}>
              <button
                type="button"
                style={{ fontFamily: m.font }}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                onClick={() => {
                  setMood(m.id);
                  navigate('/explore');
                }}
              >
                <span className="mood-word">{m.label}</span>
                <span className="mood-line">
                  {m.tagline} · 상품 {m.productIds.length}개 <ArrowRight size={16} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <AnimatePresence>
        {hover !== null && (
          <motion.div
            className="mood-preview"
            style={{ x: sx, y: sy, background: MOODS[hover].bg }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.25 }}
            aria-hidden="true"
          >
            <img src={asset(primaryImage(getProduct(MOODS[hover].productIds[0])!).src)} alt="" />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Marquee() {
  const text = '₩100,000 이상 무료배송 · 쿠폰 TUK10 10% 할인 · 14일 무료 반품 · 드래그해서 장바구니에 담아보세요 · ';
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        <span>{text.repeat(3)}</span>
        <span>{text.repeat(3)}</span>
      </div>
    </div>
  );
}

export default function Landing() {
  const { mood } = useMood();
  usePageMeta('', 'TUK FIT — 분위기로 고르고, 끌어다 담는 인터랙티브 남성복 쇼핑.');
  return (
    <motion.div className="mood-scope" style={moodStyle(mood)} animate={{ backgroundColor: mood.bg, color: mood.ink }} transition={{ duration: 0.8, ease }}>
      <Hero />
      <Marquee />
      <ScrollStory />
      <CategoryEntrance />
      <MoodIndex />
      <div className="landing-explore container">
        <MousePointerClick size={28} strokeWidth={1.4} />
        <p>마음에 드는 옷을 끌어다 장바구니에 담아보세요.</p>
        <Link to="/explore" className="cine-btn primary">
          탐색 캔버스 열기 <ArrowRight size={16} />
        </Link>
      </div>
      <RecentlyViewed />
      <Newsletter />
    </motion.div>
  );
}
