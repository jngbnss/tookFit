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
  usePageMeta('Your bag');
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
        <h1 className="page-title">Your bag</h1>
      </header>
      {cart.length === 0 ? (
        <>
          <div className="empty">
            <h2>Your bag is empty</h2>
            <p className="muted">Start with the season’s essentials — or check your wishlist for pieces you saved.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link to="/shop/all" className="btn btn-primary">
                Continue shopping
              </Link>
              <Link to="/wishlist" className="btn btn-secondary">
                View wishlist
              </Link>
            </div>
          </div>
          <section aria-labelledby="pop-title">
            <div className="section-head">
              <h2 id="pop-title">Popular right now</h2>
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
                ← Continue shopping
              </Link>
              <button type="button" className="btn-text" onClick={() => setConfirmClear(true)}>
                Clear bag
              </button>
            </div>
          </div>
          <aside className="summary" aria-label="Order summary">
            <h2 style={{ fontSize: 14, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Order summary</h2>
            <FreeShippingProgress subtotal={totals.subtotal} />
            <CouponForm />
            <SummaryRows totals={totals} coupon={coupon} />
            <button type="button" className="btn btn-primary btn-block" onClick={() => navigate('/checkout')}>
              Proceed to checkout
            </button>
            <p className="muted" style={{ fontSize: 12 }}>
              Demo store — no real payment will be taken.
            </p>
          </aside>
        </div>
      )}
      {cart.length > 0 && recommendations.length > 0 && (
        <section className="section" aria-labelledby="rec-title">
          <div className="section-head">
            <h2 id="rec-title">Complete the look</h2>
          </div>
          <ProductGrid products={recommendations as typeof PRODUCTS} />
        </section>
      )}
      <Dialog open={confirmClear} onClose={() => setConfirmClear(false)} title="Clear your bag?">
        <p style={{ marginBottom: 24 }}>This removes all {totals.itemCount} items from your bag. This can’t be undone.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              clearCart();
              setConfirmClear(false);
              notify('Your bag has been cleared.');
            }}
          >
            Clear bag
          </button>
          <button type="button" className="btn btn-secondary" data-autofocus onClick={() => setConfirmClear(false)}>
            Keep items
          </button>
        </div>
      </Dialog>
    </div>
  );
}
