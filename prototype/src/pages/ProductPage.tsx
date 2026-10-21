import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BADGE_LABELS, CATEGORIES } from '../data/products';
import type { Product, ProductImage } from '../domain/types';
import { getProduct, getProductBySlug, imagesFor } from '../lib/catalog';
import { asset } from '../lib/format';
import { isInStock } from '../lib/pricing';
import { track } from '../lib/analytics';
import { useStore } from '../state/store';
import { Price } from '../components/Price';
import { PurchasePanel } from '../components/PurchasePanel';
import { SmartImage } from '../components/SmartImage';
import { Dialog } from '../components/Overlay';
import { ProductGrid } from '../components/ProductCard';
import { RecentlyViewed } from '../components/RecentlyViewed';
import { CloseIcon, ShareIcon } from '../components/Icons';
import { RatingBadge, ReviewSection } from '../components/Reviews';
import { useFocusTrap } from '../components/useFocusTrap';
import { SizeTables } from './Info';
import { usePageMeta } from '../components/usePageMeta';
import NotFound from './NotFound';

function ProductStory({ product, colorId }: { product: Product; colorId: string | null }) {
  const images = imagesFor(product, colorId);
  const steps = [
    { label: '01 소재', title: '좋은 옷은 원단에서 시작됩니다', body: product.material, image: images[1] ?? images[0] },
    { label: '02 핏', title: '몸을 따라 자연스럽게 떨어지는 선', body: product.fit, image: images[0] },
    { label: '03 관리', title: '오래 곁에 두는 방법', body: product.care.join(' · '), image: images[1] ?? images[0] },
  ];
  return (
    <section className="pdp-story container" aria-label="상품 이야기">
      {steps.map((s, i) => (
        <article key={s.label} className={`pdp-story-step ${i % 2 ? 'flip' : ''}`}>
          <div className="pdp-story-media">
            <img src={asset(s.image.src)} alt={s.image.alt} loading="lazy" width={1024} height={1280} />
          </div>
          <div className="pdp-story-copy">
            <p className="eyebrow">{s.label}</p>
            <h2>{s.title}</h2>
            <p>{s.body}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

/** Full-screen viewer: click or tap to zoom 2.5×, move the pointer to pan, arrows to switch images. */
function Lightbox({ images, start, onClose }: { images: ProductImage[]; start: number; onClose: () => void }) {
  const [index, setIndex] = useState(start);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const ref = useFocusTrap<HTMLDivElement>(true, onClose);
  const image = images[index];

  function go(delta: number) {
    setZoomed(false);
    setIndex((i) => (i + delta + images.length) % images.length);
  }

  function move(e: ReactPointerEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  }

  return (
    <div
      ref={ref}
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="확대 이미지"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(1);
        if (e.key === 'ArrowLeft') go(-1);
      }}
    >
      <button type="button" className="icon-btn lightbox-close" onClick={onClose} aria-label="닫기">
        <CloseIcon />
      </button>
      <button
        type="button"
        className={`lightbox-stage ${zoomed ? 'zoomed' : ''}`}
        onClick={(e) => {
          move(e as unknown as ReactPointerEvent<HTMLElement>);
          setZoomed((z) => !z);
        }}
        onPointerMove={zoomed ? move : undefined}
        aria-label={zoomed ? '축소하기' : '확대하기'}
      >
        <img src={asset(image.src)} alt={image.alt} width={1024} height={1280} style={{ transformOrigin: origin }} draggable={false} />
      </button>
      {images.length > 1 && (
        <>
          <button type="button" className="lightbox-nav prev" onClick={() => go(-1)} aria-label="이전 이미지">
            ‹
          </button>
          <button type="button" className="lightbox-nav next" onClick={() => go(1)} aria-label="다음 이미지">
            ›
          </button>
        </>
      )}
      <p className="lightbox-count" aria-live="polite">
        {index + 1} / {images.length} · {zoomed ? '움직여서 둘러보기 · 클릭하면 축소' : '클릭하면 확대'}
      </p>
    </div>
  );
}

function Gallery({ product, colorId }: { product: Product; colorId: string | null }) {
  const images = imagesFor(product, colorId);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  useEffect(() => setIndex(0), [colorId]);
  const image = images[Math.min(index, images.length - 1)];
  return (
    <div className="gallery">
      <div className="thumbs" role="group" aria-label="상품 이미지">
        {images.map((img, i) => (
          <button key={img.src} type="button" aria-pressed={i === index} aria-label={`이미지 ${i + 1} / ${images.length} 보기`} onClick={() => setIndex(i)}>
            <SmartImage src={img.src} alt="" />
          </button>
        ))}
      </div>
      <button type="button" className="gallery-main" onClick={() => setZoom(true)} aria-label={`이미지 확대: ${image.alt}`}>
        <SmartImage key={image.src} src={image.src} alt={image.alt} eager />
        <span className="zoom-hint" aria-hidden="true">
          확대
        </span>
      </button>
      {zoom && <Lightbox images={images} start={index} onClose={() => setZoom(false)} />}
    </div>
  );
}

function ShareButton({ product }: { product: Product }) {
  const { notify } = useStore();
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${product.name} | TUK FIT`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      notify('링크가 복사되었습니다.');
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      notify('자동 공유에 실패했습니다. 주소창의 링크를 복사해 주세요.');
    }
  }
  return (
    <button type="button" className="btn-text" onClick={share} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
      <span style={{ width: 16, display: 'inline-flex' }}>
        <ShareIcon />
      </span>
      공유하기
    </button>
  );
}

export default function ProductPage() {
  const { slug = '' } = useParams();
  const product = getProductBySlug(slug);
  const { addRecent } = useStore();
  const [sizeGuide, setSizeGuide] = useState(false);
  const [colorId, setColorId] = useState<string | null>(null);
  const lastSlug = useRef(slug);
  if (lastSlug.current !== slug) {
    lastSlug.current = slug;
    setColorId(null);
  }

  usePageMeta(
    product?.name ?? '상품을 찾을 수 없습니다',
    product?.description.slice(0, 155),
    product && {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.images.map((i) => new URL(asset(i.src), window.location.origin).href),
      sku: product.id,
      brand: { '@type': 'Brand', name: 'TUK FIT' },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'KRW',
        price: product.price,
        availability: isInStock(product) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
    },
  );

  useEffect(() => {
    if (!product) return;
    addRecent(product.id);
    track('product_view', { productId: product.id });
  }, [product, addRecent]);

  if (!product) return <NotFound />;

  const category = CATEGORIES.find((c) => c.slug === product.category)!;
  const related = product.relatedIds.map(getProduct).filter((p): p is Product => !!p);

  return (
    <div className="has-sticky-buy">
      <div className="container">
        <nav className="breadcrumbs" aria-label="현재 위치">
          <ol>
            <li>
              <Link to="/">홈</Link>
            </li>
            <li>
              <Link to={`/shop/${category.slug}`}>{category.label}</Link>
            </li>
            <li aria-current="page">{product.name}</li>
          </ol>
        </nav>
        <div className="pdp">
          <Gallery key={product.id} product={product} colorId={colorId} />
          <div className="pdp-info">
            <div>
              {product.badge && (
                <p className="eyebrow" style={{ color: product.badge === 'SALE' ? 'var(--accent)' : undefined }}>
                  {BADGE_LABELS[product.badge]}
                </p>
              )}
              <h1>{product.name}</h1>
              <RatingBadge product={product} link />
            </div>
            <Price product={product} className="pdp-price" />
            <p style={{ color: 'var(--ink-2)' }}>{product.description}</p>
            <PurchasePanel key={product.id} product={product} onSizeGuide={() => setSizeGuide(true)} onColorChange={setColorId} />
            <div className="trust">
              <p>₩100,000 이상 구매 시 무료배송</p>
              <p>수령 후 14일 이내 무료 반품</p>
              <p>서울에서 영업일 기준 1~2일 내 출고</p>
              <ShareButton product={product} />
            </div>
            <div className="accordion">
              <details open>
                <summary>핏 안내</summary>
                <div className="acc-body">
                  <p>{product.fit}</p>
                </div>
              </details>
              <details>
                <summary>소재 및 관리</summary>
                <div className="acc-body">
                  <p style={{ marginBottom: 8 }}>{product.material}</p>
                  <ul>
                    {product.care.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              </details>
              <details>
                <summary>배송 및 반품</summary>
                <div className="acc-body">
                  <p>{product.shipping}</p>
                  <p style={{ marginTop: 8 }}>
                    <Link to="/shipping-returns" className="link-underline">
                      배송·반품 정책 전체 보기
                    </Link>
                  </p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      <ProductStory product={product} colorId={colorId} />
      <ReviewSection product={product} />

      {related.length > 0 && (
        <section className="section container" aria-labelledby="related-title">
          <div className="section-head">
            <h2 id="related-title">함께 입기 좋은 옷</h2>
          </div>
          <ProductGrid products={related} />
        </section>
      )}
      <RecentlyViewed excludeId={product.id} />

      <Dialog open={sizeGuide} onClose={() => setSizeGuide(false)} title="사이즈 가이드" wide>
        <SizeTables highlight={product.category} />
      </Dialog>
    </div>
  );
}
