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
  usePageMeta('위시리스트', '나중을 위해 저장한 상품.');
  const { wishlist, toggleWishlist, notify } = useStore();
  const [adding, setAdding] = useState<Product | null>(null);
  const products = wishlist.map(getProduct).filter((p): p is Product => !!p);

  return (
    <div className="container" style={{ paddingBottom: 96 }}>
      <header className="catalog-head">
        <h1 className="page-title">위시리스트</h1>
        <p className="muted">
          저장한 상품 {products.length}개 · 이 브라우저에 저장됩니다.
        </p>
      </header>
      {products.length === 0 ? (
        <div className="empty">
          <h2>위시리스트가 비어 있습니다</h2>
          <p className="muted">마음에 드는 옷의 하트를 눌러 저장해 두세요.</p>
          <Link to="/shop/all" className="btn btn-primary">
            컬렉션 둘러보기
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
                  장바구니로 이동
                </button>
                <button
                  type="button"
                  className="btn-text"
                  onClick={() => {
                    toggleWishlist(p.id);
                    notify(`${p.name}을(를) 위시리스트에서 삭제했습니다.`);
                  }}
                  aria-label={`${p.name} 위시리스트에서 삭제`}
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={!!adding} onClose={() => setAdding(null)} title={adding ? `${adding.name} 장바구니 담기` : ''}>
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
