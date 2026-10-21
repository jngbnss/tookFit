"use client";

import { useState } from "react";
import { errorMessage } from "@/lib/api/client";
import { myOrderApi } from "@/lib/api/me";
import type { ClaimReason, ClaimType, OrderDetail } from "@/lib/api/types";
import { CLAIM_REASON_LABEL, formatPrice } from "@/lib/format";
import { useSettings } from "../providers/Settings";

export function ClaimForm({ order, onDone }: { order: OrderDetail; onDone: () => void }) {
  const { returnShippingFee } = useSettings();
  const [itemId, setItemId] = useState(order.items[0]?.id);
  const [type, setType] = useState<ClaimType>("RETURN");
  const [reason, setReason] = useState<ClaimReason>("SIZE");
  const [quantity, setQuantity] = useState(1);
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const item = order.items.find((i) => i.id === itemId);
  const customerPays = reason === "CHANGE_OF_MIND" || reason === "SIZE";

  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!item) return;
        setBusy(true);
        setError(null);
        try {
          await myOrderApi.claim(order.orderNumber, {
            orderItemId: item.id,
            type,
            reasonType: reason,
            reasonDetail: detail.trim() || undefined,
            quantity,
          });
          onDone();
        } catch (ex) {
          setError(errorMessage(ex));
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="field">
        <span>상품</span>
        <select className="select" value={itemId} onChange={(e) => {
            setItemId(Number(e.target.value));
            setQuantity(1);
          }}>
          {order.items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.productName} ({i.colorName}/{i.size}) × {i.quantity}
            </option>
          ))}
        </select>
      </label>
      <div className="form-grid">
        <label className="field">
          <span>신청 종류</span>
          <select className="select" value={type} onChange={(e) => setType(e.target.value as ClaimType)}>
            <option value="RETURN">반품 (환불)</option>
            <option value="EXCHANGE">교환 (같은 상품)</option>
          </select>
        </label>
        <label className="field">
          <span>수량</span>
          <select className="select" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>
            {Array.from({ length: item?.quantity ?? 1 }, (_, i) => i + 1).map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="field">
        <span>사유</span>
        <select className="select" value={reason} onChange={(e) => setReason(e.target.value as ClaimReason)}>
          {(Object.keys(CLAIM_REASON_LABEL) as ClaimReason[]).map((r) => (
            <option key={r} value={r}>
              {CLAIM_REASON_LABEL[r]}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>자세한 내용 (선택)</span>
        <textarea className="textarea" maxLength={500} value={detail} onChange={(e) => setDetail(e.target.value)} />
      </label>
      <p className="small muted">
        {customerPays
          ? `단순 변심·사이즈 사유는 왕복 배송비 ${formatPrice(returnShippingFee)}이 환불 금액에서 차감돼요.`
          : "상품 불량·오배송은 배송비를 쇼핑몰이 부담해요."}{" "}
        교환은 같은 상품·옵션으로 진행되고, 다른 옵션을 원하시면 사유에 적어주세요.
      </p>
      {error && <p className="form-error">{error}</p>}
      <button className="btn" disabled={busy || !item}>
        신청하기
      </button>
    </form>
  );
}
