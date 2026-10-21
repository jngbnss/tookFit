import type { OrderDetail } from "@/lib/api/types";
import {
  CLAIM_REASON_LABEL,
  CLAIM_STATUS_LABEL,
  CLAIM_TYPE_LABEL,
  formatDateTime,
  formatPrice,
  ORDER_STATUS_LABEL,
} from "@/lib/format";
import { StatusBadge } from "../StatusBadge";

// 고객 주문 상세와 관리자 주문 상세가 함께 쓰는 정보 블록

export function ShippingBlock({ order }: { order: OrderDetail }) {
  const s = order.shipping;
  return (
    <section className="panel stack-sm small">
      <h2 className="panel-title">배송지</h2>
      <p>
        {s.recipient} · {s.phone}
      </p>
      <p>
        ({s.postalCode}) {s.address1} {s.address2}
      </p>
      {s.deliveryMemo && <p className="muted">메모: {s.deliveryMemo}</p>}
      {order.shipment && (
        <p style={{ marginTop: 8 }}>
          {order.shipment.carrierName} {order.shipment.trackingNumber}{" "}
          {order.shipment.trackingUrl && (
            <a className="link" href={order.shipment.trackingUrl} target="_blank" rel="noreferrer">
              배송 조회
            </a>
          )}
          {order.shipment.deliveredAt && <span className="muted"> · {formatDateTime(order.shipment.deliveredAt)} 배송 완료</span>}
        </p>
      )}
    </section>
  );
}

export function PaymentBlock({ order }: { order: OrderDetail }) {
  const t = order.totals;
  return (
    <section className="panel small">
      <h2 className="panel-title">결제</h2>
      <div className="summary-row">
        <span>상품 금액</span>
        <span>{formatPrice(t.subtotal)}</span>
      </div>
      {t.discount > 0 && (
        <div className="summary-row accent">
          <span>할인{order.couponCode ? ` (${order.couponCode})` : ""}</span>
          <span>−{formatPrice(t.discount)}</span>
        </div>
      )}
      <div className="summary-row">
        <span>배송비</span>
        <span>{t.shippingFee ? formatPrice(t.shippingFee) : "무료"}</span>
      </div>
      <div className="summary-total" style={{ fontSize: 16 }}>
        <span>결제 금액</span>
        <span>{formatPrice(t.total)}</span>
      </div>
      {order.payment && (
        <p className="muted" style={{ marginTop: 8 }}>
          {order.payment.method ?? order.payment.provider} · {order.payment.status}
          {order.payment.approvedAt && ` · ${formatDateTime(order.payment.approvedAt)}`}
          {order.payment.cancelledAmount > 0 && ` · 환불 ${formatPrice(order.payment.cancelledAmount)}`}
        </p>
      )}
    </section>
  );
}

export function ClaimsBlock({ order }: { order: OrderDetail }) {
  if (!order.claims.length) return null;
  const nameOf = (id: number) => {
    const it = order.items.find((i) => i.id === id);
    return it ? `${it.productName} (${it.colorName}/${it.size})` : `#${id}`;
  };
  return (
    <section className="panel small">
      <h2 className="panel-title">교환·반품</h2>
      <ul className="stack-sm">
        {order.claims.map((c) => (
          <li key={c.id} className="row between">
            <span>
              {CLAIM_TYPE_LABEL[c.type]} · {nameOf(c.orderItemId)} × {c.quantity} · {CLAIM_REASON_LABEL[c.reasonType]}
              {c.refundAmount != null && ` · 환불 ${formatPrice(c.refundAmount)}`}
            </span>
            <StatusBadge status={c.status} label={CLAIM_STATUS_LABEL[c.status]} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HistoryBlock({ order }: { order: OrderDetail }) {
  if (!order.history.length) return null;
  return (
    <section className="panel small">
      <h2 className="panel-title">진행 기록</h2>
      <ol className="timeline">
        {order.history.map((h, i) => (
          <li key={i}>
            {formatDateTime(h.createdAt)} · {ORDER_STATUS_LABEL[h.toStatus]}
            {h.reason && <span className="muted"> ({h.reason})</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}
