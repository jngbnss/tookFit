import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES, PRODUCTS } from '../data/products';
import { inCollection, sortProducts } from '../lib/catalog';
import { asset } from '../lib/format';
import { isEmail } from '../lib/validation';
import { track } from '../lib/analytics';
import { ProductGrid } from '../components/ProductCard';
import { SmartImage } from '../components/SmartImage';
import { RecentlyViewed } from '../components/RecentlyViewed';
import { usePageMeta } from '../components/usePageMeta';

function Newsletter() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!isEmail(email)) {
      setError('올바른 이메일을 입력해 주세요.');
      return;
    }
    setError('');
    setDone(true);
    track('newsletter_signup');
  }

  return (
    <section className="newsletter" aria-labelledby="nl-title">
      <div className="container newsletter-inner">
        <div>
          <p className="eyebrow">뉴스레터</p>
          <h2 id="nl-title">신상품과 시크릿 세일 소식을 가장 먼저 받아보세요.</h2>
        </div>
        {done ? (
          <p className="notice notice-success" role="status">
            구독해 주셔서 감사합니다. (데모: 이메일은 발송·저장되지 않습니다.)
          </p>
        ) : (
          <form onSubmit={submit} noValidate>
            <label htmlFor="nl-email" className="sr-only">
              이메일 주소
            </label>
            <div className="row">
              <input
                id="nl-email"
                className="input"
                type="email"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? 'nl-err' : 'nl-note'}
              />
              <button type="submit" className="btn btn-light">
                구독하기
              </button>
            </div>
            {error ? (
              <p id="nl-err" className="error-text" role="alert">
                {error}
              </p>
            ) : (
              <p id="nl-note" style={{ fontSize: 12, color: 'var(--muted)' }}>
                샘플 주소를 사용하세요. 언제든 구독 해지할 수 있습니다.
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  usePageMeta('', '서울에서 디자인한 TUK FIT F/W 컬렉션: 울 코트, 헤비 니트, 와이드 팬츠, 부츠.');
  const newArrivals = sortProducts(PRODUCTS.filter((p) => inCollection(p, 'new-arrivals')), 'newest').slice(0, 4);
  const best = PRODUCTS.filter((p) => p.badge === 'BEST').slice(0, 4);
  const catImages = Object.fromEntries(CATEGORIES.map((c) => [c.slug, PRODUCTS.find((p) => p.category === c.slug)!]));

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <picture>
          <source media="(max-width: 767px)" srcSet={asset('images/editorial/hero-mobile-01.webp')} />
          <img
            src={asset('images/editorial/hero-01.webp')}
            alt="F/W 스튜디오 스틸컷: 따뜻한 스톤 벽 앞의 블랙 울 오버코트, 크림 케이블 니트, 차콜 와이드 트라우저, 카멜 머플러, 블랙 첼시 부츠"
            width={2000}
            height={1125}
            fetchPriority="high"
          />
        </picture>
        <div className="hero-copy">
          <p className="eyebrow">2026 가을 / 겨울</p>
          <h1 id="hero-title">추위를 위해 만들고, 도시를 위해 재단하다.</h1>
          <p>블랙, 차콜, 크림으로 완성한 롱 울 코트, 정직한 니트, 와이드 트라우저.</p>
          <Link to="/shop/all" className="btn btn-primary">
            컬렉션 보러가기
          </Link>
        </div>
      </section>

      <section className="section container" aria-labelledby="new-title">
        <div className="section-head">
          <h2 id="new-title">신상품</h2>
          <Link to="/shop/new-arrivals" className="link-underline">
            전체 보기
          </Link>
        </div>
        <ProductGrid products={newArrivals} />
      </section>

      <section className="banner" aria-labelledby="ed-title">
        <img src={asset('images/editorial/editorial-02.webp')} alt="미니멀한 스튜디오에 놓인 차콜 테크니컬 파카, 크림 모크넥 니트, 브라운 코듀로이 팬츠, 올리브 비니" loading="lazy" width={2000} height={1000} />
        <div className="banner-copy">
          <p className="eyebrow">레이어링 에디트</p>
          <h2 id="ed-title">세 겹의 레이어, 하나의 차분한 팔레트.</h2>
          <p className="muted">파인 메리노와 헤비 코듀로이 위에 테크니컬 셸 — 부피감 없이 따뜻하게.</p>
          <Link to="/shop/outerwear" className="btn btn-secondary">
            아우터 보러가기
          </Link>
        </div>
      </section>

      <section className="section container" aria-labelledby="best-title">
        <div className="section-head">
          <h2 id="best-title">베스트</h2>
          <Link to="/shop/best-sellers" className="link-underline">
            전체 보기
          </Link>
        </div>
        <ProductGrid products={best} />
      </section>

      <section className="section container" aria-labelledby="cat-title" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <h2 id="cat-title">카테고리별 쇼핑</h2>
        </div>
        <ul className="cat-grid">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link to={`/shop/${c.slug}`} className="cat-tile">
                <SmartImage src={catImages[c.slug].images[0].src} alt="" />
                <span>{c.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="section container" aria-label="TUK FIT 소개">
        <div className="statement">
          <p className="eyebrow">TUK FIT</p>
          <p className="display">“오래 간직할 것만 고르세요.” 더 적은 옷, 더 좋은 원단, 시즌이 바뀌어도 변하지 않는 실루엣.</p>
          <Link to="/about" className="link-underline">
            브랜드 이야기
          </Link>
        </div>
      </section>

      <RecentlyViewed />
      <Newsletter />
    </>
  );
}
