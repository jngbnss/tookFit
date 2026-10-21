"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Dialog } from "@/components/Dialog";
import { ClaimForm } from "@/components/mypage/ClaimForm";
import { ClaimsBlock, HistoryBlock, PaymentBlock, ShippingBlock } from "@/components/order/OrderParts";
import { useToast } from "@/components/providers/Toast";
import { StatusBadge } from "@/components/StatusBadge";
import { useAsync } from "@/hooks/useAsync";
import { errorMessage } from "@/lib/api/client";
import { myOrderApi } from "@/lib/api/me";
import { formatDateTime, formatPrice, ORDER_STATUS_LABEL } from "@/lib/format";

export default function MyOrderDetailPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { notify } = useToast();
  const { data: order, error, loading, setData } = useAsync(() => myOrderApi.get(orderNumber), [orderNumber]);
  const [claimOpen, setClaimOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (error) return <p className="form-error">{error}</p>;
  if (loading || !order) return <div className="skeleton" style={{ height: 240 }} />;

  const canClaim = order.status === "DELIVERED";

  return (
    <div className="stack">
      <div className="row between">
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>
            주문 상세
          </h1>
          <p className="small muted">
            {order.orderNumber} · {formatDateTime(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status} label={ORDER_STATUS_LABEL[order.status]} />
      </div>

      {order.status === "PENDING_PAYMENT" && (
        <p className="form-error">결제가 완료되지 않은 주문이에요. 30분이 지나면 자동으로 취소돼요.</p>
      )}

      <section className="panel">
        <h2 className="panel-title">주문 상품</h2>
        <ul>
          {order.items.map((i) => (
            <li key={i.id} className="line-item">
              {i.imageUrl ? <img src={i.imageUrl} alt="" /> : <div className="ph" />}
              <div className="stack-sm" style={{ gap: 4 }}>
                <Link className="name" href={`/products/${i.productSlug}`}>
                  {i.productName}
                </Link>
                <span className="opt">
                  {i.colorName} / {i.size} · {i.quantity}개
                </span>
                {i.reviewable && !i.reviewed && (
                  <Link className="link small" href={`/mypage/reviews?write=${i.id}`}>
                    리뷰 쓰기
                  </Link>
                )}
                {i.reviewed && <span className="small muted">리뷰 작성 완료</span>}
              </div>
              <strong className="small">{formatPrice(i.lineTotal)}</strong>
            </li>
          ))}
        </ul>
      </section>

      <div className="form-grid" style={{ alignItems: "start" }}>
        <ShippingBlock order={order} />
        <PaymentBlock order={order} />
      </div>
      <ClaimsBlock order={order} />
      <HistoryBlock order={order} />

      <div className="row">
        {order.cancellable && (
          <button
            type="button"
            className="btn btn-outline"
            disabled={busy}
            onClick={async () => {
              if (!confirm("주문을 취소할까요? 결제 금액은 전액 환불돼요.")) return;
              setBusy(true);
              try {
                setData(await myOrderApi.cancel(order.orderNumber));
                notify("주문을 취소했어요.");
              } catch (e) {
                notify(errorMessage(e), "error");
              } finally {
                setBusy(false);
              }
            }}
          >
            주문 취소
          </button>
        )}
        {canClaim && (
          <button type="button" className="btn btn-outline" onClick={() => setClaimOpen(true)}>
            교환·반품 신청
          </button>
        )}
        <Link className="btn btn-ghost" href="/mypage/orders">
          목록
        </Link>
      </div>
      {!order.cancellable && ["PREPARING", "SHIPPED"].includes(order.status) && (
        <p className="small muted">배송 준비가 시작된 주문은 고객센터로 취소를 요청해주세요.</p>
      )}

      <Dialog open={claimOpen} onClose={() => setClaimOpen(false)} title="교환·반품 신청">
        <ClaimForm
          order={order}
          onDone={async () => {
            setClaimOpen(false);
            notify("신청을 접수했어요.");
            setData(await myOrderApi.get(order.orderNumber));
          }}
        />
      </Dialog>
    </div>
  );
}
