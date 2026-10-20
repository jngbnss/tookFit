import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../domain/types';
import { getProduct } from '../lib/catalog';
import { useStore } from '../state/store';
import { Price } from '../components/Price';
import { SmartImage } from '../components/SmartImage';
import { Dialog } from '../components/Overlay';
import { PurchasePanel } from '../components/PurchasePanel';
import { usePageMeta } from '../components/usePageMeta';

export default function Wishlist() {
  usePageMeta('Wishlist', 'Pieces you saved for later.');
  const { wishlist, toggleWishlist, notify } = useStore();
  const [adding, setAdding] = useState<Product | null>(null);
  const products = wishlist.map(getProduct).filter((p): p is Product => !!p);

  return (
    <div className="container" style={{ paddingBottom: 96 }}>
      <header className="catalog-head">
        <h1 className="page-title">Wishlist</h1>
        <p className="muted">
          {products.length} saved {products.length === 1 ? 'piece' : 'pieces'}. Saved in this browser.
        </p>
      </header>
      {products.length === 0 ? (
        <div className="empty">
          <h2>Your wishlist is empty</h2>
          <p className="muted">Tap the heart on any product to save it here for later.</p>
          <Link to="/shop/all" className="btn btn-primary">
            Browse the collection
          </Link>
        </div>
      ) : (
        <ul className="grid">
          {products.map((p) => (
            <li key={p.id} className="card">
              <Link to={`/product/${p.slug}`}>
                <SmartImage src={p.images[0].src} alt={p.images[0].alt} />
              </Link>
              <div className="card-info">
                <Link to={`/product/${p.slug}`} className="card-name">
                  {p.name}
                </Link>
                <Price product={p} />
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <button type="button" className="btn btn-primary btn-block" style={{ minHeight: 44 }} onClick={() => setAdding(p)}>
                  Move to bag
                </button>
                <button
                  type="button"
                  className="btn-text"
                  onClick={() => {
                    toggleWishlist(p.id);
                    notify(`${p.name} removed from your wishlist.`);
                  }}
                  aria-label={`Remove ${p.name} from wishlist`}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={!!adding} onClose={() => setAdding(null)} title={adding ? `Move ${adding.name} to bag` : ''}>
        {adding && (
          <PurchasePanel
            product={adding}
            mode="quick"
            onAdded={() => {
              toggleWishlist(adding.id);
              setAdding(null);
            }}
          />
        )}
      </Dialog>
    </div>
  );
}
