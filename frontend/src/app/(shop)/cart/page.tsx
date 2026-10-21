"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CartLine } from "@/components/cart/CartLine";
import { OrderSummaryPanel } from "@/components/cart/OrderSummaryPanel";
import { useAuth } from "@/components/providers/Auth";
import { useCart } from "@/components/providers/Cart";
import { useToast } from "@/components/providers/Toast";
import { errorMessage } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const cart = useCart();
  const { me } = useAuth();
  const router = useRouter();
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);

  const unavailable = cart.items.filter((i) => !i.available);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      notify(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  if (cart.loading && cart.items.length === 0) {
    return (
      <div className="container page">
        <h1 className="page-title">장바구니</h1>
        <div className="skeleton" style={{ height: 160 }} />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="container page">
        <h1 className="page-title">장바구니</h1>
        <div className="empty stack" style={{ alignItems: "center" }}>
          <p>장바구니가 비어 있어요.</p>
          <Link className="btn" href="/shop/new-arrivals">
            신상품 보러 가기
          </Link>
        </div>
      </div>
    );
  }

  const t = cart.totals;
  const progress = t.subtotal + t.freeShippingRemaining > 0 ? (t.subtotal / (t.subtotal + t.freeShippingRemaining)) * 100 : 100;

  return (
    <div className="container page">
      <h1 className="page-title">장바구니 ({cart.count})</h1>
      <div className="two-col">
        <div>
          <div className="panel" style={{ marginBottom: 16 }}>
            {t.freeShippingRemaining > 0 ? (
              <p className="small">
                <strong>{formatPrice(t.freeShippingRemaining)}</strong> 더 담으면 무료배송이에요.
              </p>
            ) : (
              <p className="small success">무료배송 조건을 채웠어요.</p>
            )}
            <div className="progress" aria-hidden="true">
              <span style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
          </div>
          {unavailable.length > 0 && (
            <p className="form-error" role="alert" style={{ marginBottom: 12 }}>
              품절되었거나 판매가 중지된 상품 {unavailable.length}개는 주문에서 빠져요.
            </p>
          )}
          <ul>
            {cart.items.map((item) => (
              <CartLine
                key={item.id}
                item={item}
                disabled={busy}
                onQuantity={(q) => run(() => cart.update(item.id, q))}
                onRemove={() => run(() => cart.remove(item.id))}
              />
            ))}
          </ul>
          <div className="row between" style={{ marginTop: 16 }}>
            <Link className="link small" href="/shop/all">
              쇼핑 계속하기
            </Link>
            <button
              type="button"
              className="link small"
              disabled={busy}
              onClick={() => {
                if (confirm("장바구니를 모두 비울까요?")) run(cart.clear);
              }}
            >
              전체 삭제
            </button>
          </div>
        </div>
        <OrderSummaryPanel totals={t}>
          {cart.mode === "guest" && <p className="small muted">비회원 장바구니 금액은 예상 금액이에요. 로그인하면 최신 가격으로 다시 계산돼요.</p>}
          <button
            type="button"
            className="btn btn-block"
            disabled={busy || cart.items.every((i) => !i.available)}
            onClick={() => router.push(me ? "/checkout" : "/login?redirect=%2Fcheckout")}
          >
            주문하기
          </button>
        </OrderSummaryPanel>
      </div>
    </div>
  );
}
