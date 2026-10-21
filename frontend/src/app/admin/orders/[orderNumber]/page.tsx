"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ClaimsBlock, HistoryBlock, PaymentBlock, ShippingBlock } from "@/components/order/OrderParts";
import { useToast } from "@/components/providers/Toast";
import { StatusBadge } from "@/components/StatusBadge";
import { useAsync } from "@/hooks/useAsync";
import { adminApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import type { AdminOrderDetail, Carrier } from "@/lib/api/types";
import { CARRIERS, formatDateTime, formatPrice, ORDER_STATUS_LABEL } from "@/lib/format";

export default function AdminOrderDetailPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { notify } = useToast();
  const { data: order, error, loading, setData } = useAsync(() => adminApi.order(orderNumber), [orderNumber]);
  const [busy, setBusy] = useState(false);
  const [carrier, setCarrier] = useState<Carrier>("CJ");
  const [tracking, setTracking] = useState("");

  const run = async (fn: () => Promise<AdminOrderDetail>, msg: string) => {
    setBusy(true);
    try {
      setData(await fn());
      notify(msg);
    } catch (e) {
      notify(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  if (error) return <p className="form-error">{error}</p>;
  if (loading || !order) return <div className="skeleton" style={{ height: 240 }} />;

  const canShip = order.nextStatuses.includes("SHIPPED");
  const canCancel = order.nextStatuses.includes("CANCELLED");
  const otherNext = order.nextStatuses.filter((s) => s !== "SHIPPED" && s !== "CANCELLED");

  return (
    <div className="stack">
      <div className="admin-head">
        <div>
          <p className="small muted">
            <Link href="/admin/orders">주문</Link> / {order.orderNumber}
          </p>
          <h1>
            {order.orderName} <StatusBadge status={order.status} label={ORDER_STATUS_LABEL[order.status]} />
          </h1>
          <p className="small muted">주문 {formatDateTime(order.createdAt)}{order.paidAt && ` · 결제 ${formatDateTime(order.paidAt)}`}</p>
        </div>
      </div>

      <section className="panel stack">
        <h2 className="panel-title" style={{ marginBottom: 0 }}>
          처리
        </h2>
        {order.nextStatuses.length === 0 && <p className="small muted">더 진행할 단계가 없어요.</p>}
        {otherNext.length > 0 && (
          <div className="row">
            {otherNext.map((s) => (
              <button
                key={s}
                type="button"
                className="btn btn-sm"
                disabled={busy}
                onClick={() => run(() => adminApi.setOrderStatus(order.orderNumber, s), `${ORDER_STATUS_LABEL[s]}(으)로 바꿨어요.`)}
              >
                {ORDER_STATUS_LABEL[s]}(으)로 변경
              </button>
            ))}
          </div>
        )}
        {canShip && (
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              if (!tracking.trim()) return notify("송장번호를 입력해주세요.", "error");
              run(() => adminApi.ship(order.orderNumber, carrier, tracking.trim()), "송장을 등록하고 배송중으로 바꿨어요.");
            }}
          >
            <select className="select" style={{ width: "auto" }} value={carrier} onChange={(e) => setCarrier(e.target.value as Carrier)} aria-label="택배사">
              {CARRIERS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <input className="input" style={{ width: 220 }} placeholder="송장번호" value={tracking} onChange={(e) => setTracking(e.target.value.replace(/[^\d-]/g, ""))} />
            <button className="btn btn-sm" disabled={busy}>
              송장 등록 · 발송
            </button>
          </form>
        )}
        {canCancel && (
          <div>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              disabled={busy}
              onClick={() => {
                const reason = prompt("취소 사유를 입력해주세요. 결제 금액은 전액 환불되고 재고가 복구돼요.");
                if (reason?.trim()) run(() => adminApi.cancelOrder(order.orderNumber, reason.trim()), "주문을 취소하고 환불했어요.");
              }}
            >
              주문 취소 · 환불
            </button>
          </div>
        )}
      </section>

      <section className="panel">
        <h2 className="panel-title">주문 상품</h2>
        <div className="table-wrap" style={{ border: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th />
                <th>상품</th>
                <th>옵션</th>
                <th className="num">단가</th>
                <th className="num">수량</th>
                <th className="num">합계</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((i) => (
                <tr key={i.id}>
                  <td>{i.imageUrl ? <img className="thumb-sm" src={i.imageUrl} alt="" /> : null}</td>
                  <td>
                    <Link className="link" href={`/admin/products/${i.productId}`}>
                      {i.productName}
                    </Link>
                  </td>
                  <td>
                    {i.colorName} / {i.size}
                  </td>
                  <td className="num">{formatPrice(i.unitPrice)}</td>
                  <td className="num">{i.quantity}</td>
                  <td className="num">{formatPrice(i.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="form-grid" style={{ alignItems: "start" }}>
        <section className="panel small stack-sm">
          <h2 className="panel-title">주문자</h2>
          <p>
            {order.orderer.name} · {order.orderer.phone ?? "-"} · {order.orderer.email ?? "-"}
          </p>
          <p className="muted">
            회원 #{order.user.id}{" "}
            <Link className="link" href={`/admin/users?q=${encodeURIComponent(order.user.email ?? order.user.name)}`}>
              회원 보기
            </Link>
          </p>
        </section>
        <ShippingBlock order={order} />
      </div>
      <div className="form-grid" style={{ alignItems: "start" }}>
        <PaymentBlock order={order} />
        <section className="panel small">
          <h2 className="panel-title">결제 기록</h2>
          {order.payments.length === 0 && <p className="muted">결제 기록이 없어요.</p>}
          <ul className="stack-sm">
            {order.payments.map((p) => (
              <li key={p.id}>
                {p.provider} · {p.method ?? "-"} · {p.status} · {formatPrice(p.amount)}
                {p.cancelledAmount > 0 && ` (환불 ${formatPrice(p.cancelledAmount)})`}
                <br />
                <span className="muted">
                  {p.pgPaymentKey ?? ""} {p.approvedAt && formatDateTime(p.approvedAt)} {p.failureReason ?? ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <ClaimsBlock order={order} />
      {order.claims.length > 0 && (
        <Link className="link small" href="/admin/claims">
          교환·반품 처리하러 가기
        </Link>
      )}
      <HistoryBlock order={order} />
    </div>
  );
}
