import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CATEGORIES, PRODUCTS } from '../data/products';
import { MOODS } from '../data/moods';
import type { Product } from '../domain/types';
import { getProduct, primaryImage } from '../lib/catalog';
import { asset, formatKRW } from '../lib/format';
import { discountPercent } from '../lib/pricing';
import { moodStyle, useMood } from '../cinematic/MoodContext';
import { Newsletter } from '../components/Newsletter';
import { ProductGrid } from '../components/ProductCard';
import { RecentlyViewed } from '../components/RecentlyViewed';
import { SmartImage } from '../components/SmartImage';
import { usePageMeta } from '../components/usePageMeta';

function moodProducts(ids: string[]) {
  return ids.map(getProduct).filter((p): p is Product => !!p);
}

function MoodSwitcher() {
  const { mood, setMood } = useMood();
  return (
    <div className="mood-switcher" role="radiogroup" aria-label="분위기 선택">
      {MOODS.map((m) => (
        <button key={m.id} type="button" role="radio" aria-checked={m.id === mood.id} onClick={() => setMood(m.id)}>
          {m.label}
        </button>
      ))}
    </div>
  );
}

function Hero() {
  const { mood } = useMood();
  const hero = moodProducts(mood.productIds)[0];
  const img = primaryImage(hero);
  const pct = discountPercent(hero);
  return (
    <section className="cine-hero" aria-labelledby="cine-title">
      <div className="cine-hero-copy">
        <p className="cine-eyebrow">2026 Fall / Winter · {mood.label}</p>
        <h1 id="cine-title" className="cine-title">
          {mood.tagline}
        </h1>
        <p className="cine-sub">{mood.description}</p>
        <div className="cine-ctas">
          <Link to="/explore" className="cine-btn primary">
            컬렉션 보기 <ArrowRight size={16} />
          </Link>
          <Link to={`/product/${hero.slug}`} className="cine-btn">
            대표 상품
          </Link>
        </div>
        <MoodSwitcher />
      </div>
      <div className="cine-stage">
        <Link to={`/product/${hero.slug}`} className="cine-product" aria-label={`${hero.name} 상세 보기`}>
          <img src={asset(img.src)} alt={img.alt} width={1024} height={1280} fetchPriority="high" />
          <span className="cine-tag">
            <span>{hero.name}</span>
            <span>
              {formatKRW(hero.price)}
              {pct > 0 && <em> {pct}%</em>}
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}

function Selection() {
  const { mood } = useMood();
  const items = moodProducts(mood.productIds).slice(1, 5);
  return (
    <section className="container section" aria-labelledby="selection-title">
      <div className="section-head">
        <div>
          <h2 id="selection-title">이번 시즌의 선택</h2>
          <p className="muted" style={{ marginTop: 6 }}>
            {mood.label} 무드로 고른 네 가지.
          </p>
        </div>
        <Link to={`/explore?mood=${mood.id}&view=list`} className="link-underline">
          모두 보기
        </Link>
      </div>
      <ProductGrid products={items} />
    </section>
  );
}

function Categories() {
  return (
    <section className="container section" aria-labelledby="cat-title" style={{ paddingTop: 0 }}>
      <div className="section-head">
        <h2 id="cat-title">카테고리</h2>
        <Link to="/explore?view=list" className="link-underline">
          전체 상품
        </Link>
      </div>
      <ul className="cat-grid">
        {CATEGORIES.map((c) => {
          const p = PRODUCTS.find((x) => x.category === c.slug)!;
          return (
            <li key={c.slug}>
              <Link to={`/explore?category=${c.slug}&view=list`} className="cat-tile">
                <SmartImage src={primaryImage(p).src} alt="" />
                <span>{c.label}</span>
                <span className="muted" style={{ fontSize: 13, letterSpacing: 0, textTransform: 'none' }}>
                  {c.blurb}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function MoodIndex() {
  const { setMood } = useMood();
  const navigate = useNavigate();
  return (
    <section className="mood-index" aria-labelledby="mood-index-title">
      <div className="container">
        <h2 id="mood-index-title" className="cine-eyebrow">
          Shop by Mood
        </h2>
        <ul>
          {MOODS.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => {
                  setMood(m.id);
                  navigate(`/explore?mood=${m.id}&view=list`);
                }}
              >
                <span className="mood-word">{m.label}</span>
                <span className="mood-line">
                  {m.tagline} <ArrowRight size={16} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function Landing() {
  const { mood } = useMood();
  usePageMeta('', 'TUK FIT — 서울에서 디자인한 남성복. 2026 가을·겨울 컬렉션.');
  return (
    <div className="mood-scope" style={moodStyle(mood)}>
      <Hero />
      <Selection />
      <Categories />
      <MoodIndex />
      <div className="landing-explore container">
        <p>입어볼 옷을 직접 골라 나란히 놓아 보세요.</p>
        <Link to="/explore?view=canvas" className="cine-btn primary">
          탐색 캔버스 <ArrowRight size={16} />
        </Link>
      </div>
      <RecentlyViewed />
      <Newsletter />
    </div>
  );
}
