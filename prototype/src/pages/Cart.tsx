import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PRODUCTS } from '../data/products';
import { useStore } from '../state/store';
import { CartLine, CouponForm, FreeShippingProgress, SummaryRows } from '../components/CartParts';
import { Dialog } from '../components/Overlay';
import { ProductGrid } from '../components/ProductCard';
import { usePageMeta } from '../components/usePageMeta';
import { getProduct } from '../lib/catalog';

export default function Cart() {
  usePageMeta('장바구니');
  const { cart, totals, coupon, clearCart, notify } = useStore();
  const [confirmClear, setConfirmClear] = useState(false);
  const navigate = useNavigate();

  const inCart = new Set(cart.map((i) => i.productId));
  const recIds = cart.flatMap((i) => getProduct(i.productId)?.relatedIds ?? []);
  const recommendations = [...new Set(recIds)]
    .filter((id) => !inCart.has(id))
    .map(getProduct)
    .filter((p) => !!p)
    .slice(0, 4);
  const fallbackRecs = PRODUCTS.filter((p) => p.badge === 'BEST' && !inCart.has(p.id)).slice(0, 4);

  return (
    <div className="container" style={{ paddingBottom: 64 }}>
      <header className="catalog-head">
        <h1 className="page-title">장바구니</h1>
      </header>
      {cart.length === 0 ? (
        <>
          <div className="empty">
            <h2>장바구니가 비어 있습니다</h2>
            <p className="muted">이번 시즌의 옷을 둘러보거나, 저장해 둔 위시리스트를 확인해 보세요.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link to="/shop/all" className="btn btn-primary">
                쇼핑 계속하기
              </Link>
              <Link to="/wishlist" className="btn btn-secondary">
                위시리스트 보기
              </Link>
            </div>
          </div>
          <section aria-labelledby="pop-title">
            <div className="section-head">
              <h2 id="pop-title">많이 찾는 옷</h2>
            </div>
            <ProductGrid products={fallbackRecs} />
          </section>
        </>
      ) : (
        <div className="two-col">
          <div>
            <ul>
              {cart.map((item) => (
                <CartLine key={item.key} item={item} />
              ))}
            </ul>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, gap: 12, flexWrap: 'wrap' }}>
              <Link to="/shop/all" className="btn-text">
                ← 쇼핑 계속하기
              </Link>
              <button type="button" className="btn-text" onClick={() => setConfirmClear(true)}>
                전체 삭제
              </button>
            </div>
          </div>
          <aside className="summary" aria-label="주문 요약">
            <h2 style={{ fontSize: 14, letterSpacing: '0.14em', textTransform: 'uppercase' }}>주문 요약</h2>
            <FreeShippingProgress subtotal={totals.subtotal} />
            <CouponForm />
            <SummaryRows totals={totals} coupon={coupon} />
            <button type="button" className="btn btn-primary btn-block" onClick={() => navigate('/checkout')}>
              주문하기
            </button>
            <p className="muted" style={{ fontSize: 12 }}>
              데모 스토어 — 실제 결제는 이루어지지 않습니다.
            </p>
          </aside>
        </div>
      )}
      {cart.length > 0 && recommendations.length > 0 && (
        <section className="section" aria-labelledby="rec-title">
          <div className="section-head">
            <h2 id="rec-title">함께 입기 좋은 옷</h2>
          </div>
          <ProductGrid products={recommendations as typeof PRODUCTS} />
        </section>
      )}
      <Dialog open={confirmClear} onClose={() => setConfirmClear(false)} title="장바구니를 비울까요?">
        <p style={{ marginBottom: 24 }}>장바구니의 상품 {totals.itemCount}개가 모두 삭제됩니다. 되돌릴 수 없습니다.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              clearCart();
              setConfirmClear(false);
              notify('장바구니를 비웠습니다.');
            }}
          >
            모두 삭제
          </button>
          <button type="button" className="btn btn-secondary" data-autofocus onClick={() => setConfirmClear(false)}>
            유지하기
          </button>
        </div>
      </Dialog>
    </div>
  );
}
