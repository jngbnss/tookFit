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
          주문 상품
        </h2>
        <ul>
          {order.lines.map((l, i) => (
            <li key={i} className="line">
              <SmartImage src={l.image} alt={`${l.colorName} ${l.name}`} />
              <div className="line-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span>{l.name}</span>
                  <span>{formatKRW(l.unitPrice * l.quantity)}</span>
                </div>
                <p className="line-meta">
                  {l.colorName} · 사이즈 {l.size} · 수량 {l.quantity} · 개당 {formatKRW(l.unitPrice)}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="form-grid" style={{ marginTop: 24 }}>
          <div className="stack" style={{ gap: 4 }}>
            <h3 className="eyebrow">배송지</h3>
            <p>{s.fullName}</p>
            <p>
              {s.address}, {s.city} {s.postalCode}
            </p>
            <p className="muted">
              {s.email} · {s.phone}
            </p>
            {s.note && <p className="muted">배송 메모: {s.note}</p>}
          </div>
          <div className="stack" style={{ gap: 4 }}>
            <h3 className="eyebrow">결제 수단</h3>
            <p>
              {order.payment.label}
              {order.payment.last4 ? ` (끝자리 ${order.payment.last4})` : ''}
            </p>
            <p className="muted" style={{ fontSize: 13 }}>
              시뮬레이션 결제 — 실제 청구되지 않았습니다.
            </p>
          </div>
        </div>
      </div>
      <aside className="summary" aria-label="결제 금액">
        <div className="summary-row">
          <span>상품 금액</span>
          <span>{formatKRW(order.totals.subtotal)}</span>
        </div>
        <div className="summary-row">
          <span>할인{order.coupon ? ` (${order.coupon})` : ''}</span>
          <span>{order.totals.discount ? `−${formatKRW(order.totals.discount)}` : formatKRW(0)}</span>
        </div>
        <div className="summary-row">
          <span>배송비</span>
          <span>{order.totals.shipping === 0 ? '무료' : formatKRW(order.totals.shipping)}</span>
        </div>
        <div className="summary-row summary-total">
          <span>총 결제 금액</span>
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
  usePageMeta('주문 완료');
  if (!order) return <NotFound />;
  return (
    <div className="container" style={{ paddingBottom: 96 }}>
      <header className="catalog-head">
        <p className="eyebrow">감사합니다</p>
        <h1 className="page-title">주문이 완료되었습니다.</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          주문번호 <strong style={{ color: 'var(--ink)' }}>{order.id}</strong> · {formatDate(order.createdAt)} 주문
        </p>
        <p className="notice" style={{ marginTop: 16, maxWidth: 640 }}>
          데모 주문입니다. 실제 배송이나 확인 메일은 없으며, 민감하지 않은 주문 정보만 이 브라우저에 저장됩니다.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
          <Link to="/shop/all" className="btn btn-primary">
            쇼핑 계속하기
          </Link>
          <Link to="/account/orders" className="btn btn-secondary">
            주문 내역 보기
          </Link>
        </div>
      </header>
      <OrderBody order={order} />
    </div>
  );
}

export function OrderHistory() {
  const { orders } = useStore();
  usePageMeta('주문 내역');
  return (
    <div className="container" style={{ paddingBottom: 96 }}>
      <nav className="breadcrumbs" aria-label="현재 위치">
        <ol>
          <li>
            <Link to="/account">마이페이지</Link>
          </li>
          <li aria-current="page">주문 내역</li>
        </ol>
      </nav>
      <header className="catalog-head">
        <h1 className="page-title">주문 내역</h1>
      </header>
      {orders.length === 0 ? (
        <div className="empty">
          <h2>아직 주문 내역이 없습니다</h2>
          <p className="muted">데모 결제를 완료하면 이곳에 주문이 표시됩니다.</p>
          <Link to="/shop/all" className="btn btn-primary">
            쇼핑 시작하기
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
                  {formatDate(o.createdAt)} · {o.lines.reduce((n, l) => n + l.quantity, 0)}개 · {o.payment.label}
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
  usePageMeta(order ? `주문 ${order.id}` : '주문을 찾을 수 없습니다');
  if (!order) return <NotFound />;
  return (
    <div className="container" style={{ paddingBottom: 96 }}>
      <nav className="breadcrumbs" aria-label="현재 위치">
        <ol>
          <li>
            <Link to="/account">마이페이지</Link>
          </li>
          <li>
            <Link to="/account/orders">주문 내역</Link>
          </li>
          <li aria-current="page">{order.id}</li>
        </ol>
      </nav>
      <header className="catalog-head">
        <h1 className="page-title">주문 {order.id}</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          {formatDate(order.createdAt)} 주문 · <span className="status-pill">{order.status}</span>
        </p>
      </header>
      <OrderBody order={order} />
    </div>
  );
}
