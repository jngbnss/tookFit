import { Link, useParams } from 'react-router-dom';
import type { Order } from '../domain/types';
import { asset, formatDate, formatKRW } from '../lib/format';
import { useStore } from '../state/store';
import { SmartImage } from '../components/SmartImage';
import { usePageMeta } from '../components/usePageMeta';
import NotFound from './NotFound';

function OrderBody({ order }: { order: Order }) {
  const s = order.shipping;
  return (
    <div className="two-col">
      <div>
        <h2 className="checkout-section" style={{ fontSize: 14, letterSpacing: '0.14em', textTransform: 'uppercase', paddingBottom: 12 }}>
          Items
        </h2>
        <ul>
          {order.lines.map((l, i) => (
            <li key={i} className="line">
              <SmartImage src={l.image} alt={`${l.name} in ${l.colorName}`} />
              <div className="line-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span>{l.name}</span>
                  <span>{formatKRW(l.unitPrice * l.quantity)}</span>
                </div>
                <p className="line-meta">
                  {l.colorName} · Size {l.size} · Qty {l.quantity} · {formatKRW(l.unitPrice)} each
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="form-grid" style={{ marginTop: 24 }}>
          <div className="stack" style={{ gap: 4 }}>
            <h3 className="eyebrow">Shipping to</h3>
            <p>{s.fullName}</p>
            <p>
              {s.address}, {s.city} {s.postalCode}
            </p>
            <p className="muted">
              {s.email} · {s.phone}
            </p>
            {s.note && <p className="muted">Note: {s.note}</p>}
          </div>
          <div className="stack" style={{ gap: 4 }}>
            <h3 className="eyebrow">Payment</h3>
            <p>
              {order.payment.label}
              {order.payment.last4 ? ` ending in ${order.payment.last4}` : ''}
            </p>
            <p className="muted" style={{ fontSize: 13 }}>
              Simulated payment — no charge was made.
            </p>
          </div>
        </div>
      </div>
      <aside className="summary" aria-label="Order totals">
        <div className="summary-row">
          <span>Subtotal</span>
          <span>{formatKRW(order.totals.subtotal)}</span>
        </div>
        <div className="summary-row">
          <span>Discount{order.coupon ? ` (${order.coupon})` : ''}</span>
          <span>{order.totals.discount ? `−${formatKRW(order.totals.discount)}` : formatKRW(0)}</span>
        </div>
        <div className="summary-row">
          <span>Shipping</span>
          <span>{order.totals.shipping === 0 ? 'Free' : formatKRW(order.totals.shipping)}</span>
        </div>
        <div className="summary-row summary-total">
          <span>Total paid</span>
          <span>{formatKRW(order.totals.total)}</span>
        </div>
      </aside>
    </div>
  );
}

export function OrderConfirmation() {
  const { id = '' } = useParams();
  const { orders } = useStore();
  const order = orders.find((o) => o.id === id);
  usePageMeta('Order confirmed');
  if (!order) return <NotFound />;
  return (
    <div className="container" style={{ paddingBottom: 96 }}>
      <header className="catalog-head">
        <p className="eyebrow">Thank you</p>
        <h1 className="page-title">Your order is confirmed.</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Order number <strong style={{ color: 'var(--ink)' }}>{order.id}</strong> · placed {formatDate(order.createdAt)}
        </p>
        <p className="notice" style={{ marginTop: 16, maxWidth: 640 }}>
          This is a demo order. Nothing will ship and no confirmation email is sent. Only non-sensitive order details are saved in this browser.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
          <Link to="/shop/all" className="btn btn-primary">
            Continue shopping
          </Link>
          <Link to="/account/orders" className="btn btn-secondary">
            View orders
          </Link>
        </div>
      </header>
      <OrderBody order={order} />
    </div>
  );
}

export function OrderHistory() {
  const { orders } = useStore();
  usePageMeta('Order history');
  return (
    <div className="container" style={{ paddingBottom: 96 }}>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link to="/account">Account</Link>
          </li>
          <li aria-current="page">Orders</li>
        </ol>
      </nav>
      <header className="catalog-head">
        <h1 className="page-title">Order history</h1>
      </header>
      {orders.length === 0 ? (
        <div className="empty">
          <h2>No orders yet</h2>
          <p className="muted">When you complete a demo checkout, your orders will appear here.</p>
          <Link to="/shop/all" className="btn btn-primary">
            Start shopping
          </Link>
        </div>
      ) : (
        <ul>
          {orders.map((o) => (
            <li key={o.id} className="order-card">
              <div>
                <p>
                  <Link to={`/account/orders/${o.id}`} className="link-underline">
                    {o.id}
                  </Link>
                </p>
                <p className="muted">
                  {formatDate(o.createdAt)} · {o.lines.reduce((n, l) => n + l.quantity, 0)} items · {o.payment.label}
                </p>
                <div className="thumb-row">
                  {o.lines.slice(0, 5).map((l, i) => (
                    <img key={i} src={asset(l.image)} alt={l.name} loading="lazy" width={48} height={60} />
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'grid', gap: 6, alignContent: 'start' }}>
                <span className="status-pill">{o.status}</span>
                <span>{formatKRW(o.totals.total)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function OrderDetail() {
  const { id = '' } = useParams();
  const { orders } = useStore();
  const order = orders.find((o) => o.id === id);
  usePageMeta(order ? `Order ${order.id}` : 'Order not found');
  if (!order) return <NotFound />;
  return (
    <div className="container" style={{ paddingBottom: 96 }}>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link to="/account">Account</Link>
          </li>
          <li>
            <Link to="/account/orders">Orders</Link>
          </li>
          <li aria-current="page">{order.id}</li>
        </ol>
      </nav>
      <header className="catalog-head">
        <h1 className="page-title">Order {order.id}</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Placed {formatDate(order.createdAt)} · <span className="status-pill">{order.status}</span>
        </p>
      </header>
      <OrderBody order={order} />
    </div>
  );
}
