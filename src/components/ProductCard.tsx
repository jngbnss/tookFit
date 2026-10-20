import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../domain/types';
import { useStore } from '../state/store';
import { asset } from '../lib/format';
import { HeartIcon } from './Icons';
import { BADGE_LABELS } from '../data/products';
import { Price } from './Price';
import { SmartImage } from './SmartImage';
import { Dialog } from './Overlay';
import { PurchasePanel } from './PurchasePanel';
import { RatingBadge } from './Reviews';

export function ProductCard({ product, eager = false }: { product: Product; eager?: boolean }) {
  const { toggleWishlist, isWishlisted, notify } = useStore();
  const [quickOpen, setQuickOpen] = useState(false);
  const wished = isWishlisted(product.id);

  return (
    <article className="card">
      <div className="card-media">
        <SmartImage src={product.images[0].src} alt={product.images[0].alt} eager={eager} imgClassName="primary" />
        {product.images[1] && (
          <img className="secondary" src={asset(product.images[1].src)} alt="" aria-hidden="true" loading="lazy" width={1024} height={1280} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        {product.badge && <span className={`card-badge ${product.badge === 'SALE' ? 'sale' : ''}`}>{BADGE_LABELS[product.badge]}</span>}
        <button
          type="button"
          className="icon-btn card-wish"
          aria-pressed={wished}
          aria-label={wished ? `${product.name} 위시리스트에서 삭제` : `${product.name} 위시리스트에 추가`}
          onClick={() => {
            const added = toggleWishlist(product.id);
            notify(added ? `${product.name}을(를) 위시리스트에 저장했습니다.` : `${product.name}을(를) 위시리스트에서 삭제했습니다.`, added ? { label: '보기', to: '/wishlist' } : undefined);
          }}
        >
          <HeartIcon filled={wished} />
        </button>
        <button type="button" className="card-quick" onClick={() => setQuickOpen(true)} aria-label={`${product.name} 빠른 담기`}>
          빠른 담기
        </button>
      </div>
      <div className="card-info">
        <h3 className="card-name">
          <Link to={`/product/${product.slug}`}>{product.name}</Link>
        </h3>
        <Price product={product} />
        <RatingBadge product={product} />
        <div className="card-swatches" aria-label={`색상: ${product.colors.map((c) => c.name).join(', ')}`}>
          {product.colors.map((c) => (
            <span key={c.id} className="swatch-dot" style={{ background: c.hex }} />
          ))}
        </div>
      </div>
      <Dialog open={quickOpen} onClose={() => setQuickOpen(false)} title={product.name}>
        <div className="stack">
          <Price product={product} />
          <PurchasePanel product={product} mode="quick" onAdded={() => setQuickOpen(false)} />
          <Link className="btn-text" to={`/product/${product.slug}`} onClick={() => setQuickOpen(false)}>
            상세 정보 보기
          </Link>
        </div>
      </Dialog>
    </article>
  );
}

export function ProductGrid({ products, eagerCount = 0 }: { products: Product[]; eagerCount?: number }) {
  return (
    <ul className="grid">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} eager={i < eagerCount} />
        </li>
      ))}
    </ul>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid" aria-busy="true" aria-label="상품 불러오는 중">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="skeleton-card">
          <div className="sk-img skeleton" />
          <div className="sk-line skeleton" />
          <div className="sk-line skeleton" style={{ width: '40%' }} />
        </li>
      ))}
    </ul>
  );
}
