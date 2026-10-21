import type { ReactNode } from "react";
import type { Totals } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";

export function OrderSummaryPanel({ totals, children, title = "결제 금액" }: { totals: Totals; children?: ReactNode; title?: string }) {
  return (
    <aside className="panel sticky-panel stack">
      <h2 className="panel-title" style={{ marginBottom: 0 }}>
        {title}
      </h2>
      <div>
        <div className="summary-row">
          <span>상품 금액</span>
          <span>{formatPrice(totals.subtotal)}</span>
        </div>
        {totals.discount > 0 && (
          <div className="summary-row accent">
            <span>할인</span>
            <span>−{formatPrice(totals.discount)}</span>
          </div>
        )}
        <div className="summary-row">
          <span>배송비</span>
          <span>{totals.shippingFee ? formatPrice(totals.shippingFee) : "무료"}</span>
        </div>
        <div className="summary-total">
          <span>합계</span>
          <span>{formatPrice(totals.total)}</span>
        </div>
      </div>
      {children}
    </aside>
  );
}
