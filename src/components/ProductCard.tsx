import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../domain/types';
import { useStore } from '../state/store';
import { asset } from '../lib/format';
import { HeartIcon } from './Icons';
import { Price } from './Price';
import { SmartImage } from './SmartImage';
import { Dialog } from './Overlay';
import { PurchasePanel } from './PurchasePanel';

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
        {product.badge && <span className={`card-badge ${product.badge === 'SALE' ? 'sale' : ''}`}>{product.badge}</span>}
        <button
          type="button"
          className="icon-btn card-wish"
          aria-pressed={wished}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          onClick={() => {
            const added = toggleWishlist(product.id);
            notify(added ? `${product.name} saved to your wishlist.` : `${product.name} removed from your wishlist.`, added ? { label: 'View', to: '/wishlist' } : undefined);
          }}
        >
          <HeartIcon filled={wished} />
        </button>
        <button type="button" className="card-quick" onClick={() => setQuickOpen(true)} aria-label={`Quick add ${product.name}`}>
          Quick add
        </button>
      </div>
      <div className="card-info">
        <h3 className="card-name">
          <Link to={`/product/${product.slug}`}>{product.name}</Link>
        </h3>
        <Price product={product} />
        <div className="card-swatches" aria-label={`Available in ${product.colors.map((c) => c.name).join(', ')}`}>
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
            View full details
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
    <ul className="grid" aria-busy="true" aria-label="Loading products">
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
