"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { errorMessage } from "@/lib/api/client";
import { paymentApi } from "@/lib/api/orders";
import type { OrderDetail } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { useCart } from "../providers/Cart";

export function PaymentSuccess() {
  const params = useSearchParams();
  const cart = useCart();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const paymentKey = params.get("paymentKey");
  const orderNumber = params.get("orderId");
  const amount = Number(params.get("amount"));

  useEffect(() => {
    // 승인은 한 번만 요청한다 (개발 모드의 이중 실행, 새로고침 대비는 서버가 멱등 처리)
    if (started.current) return;
    started.current = true;
    if (!paymentKey || !orderNumber || !Number.isFinite(amount)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 잘못된 진입은 바로 안내한다
      setError("결제 정보가 올바르지 않아요.");
      return;
    }
    paymentApi
      .confirm({ orderNumber, paymentKey, amount })
      .then((o) => {
        setOrder(o);
        cart.reload().catch(() => {});
      })
      .catch((e) => setError(errorMessage(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="container page narrow stack">
        <h1 className="page-title">결제를 완료하지 못했어요</h1>
        <p className="form-error">{error}</p>
        <p className="small muted">카드 승인이 되었다면 자동으로 취소돼요. 같은 주문을 다시 결제하려면 주문 내역에서 확인해주세요.</p>
        <div className="row">
          <Link className="btn" href="/cart">
            장바구니로
          </Link>
          {orderNumber && (
            <Link className="btn btn-outline" href={`/mypage/orders/${orderNumber}`}>
              주문 확인
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container page narrow" aria-busy="true">
        <h1 className="page-title">결제를 확인하고 있어요</h1>
        <p className="muted">창을 닫지 말고 잠시만 기다려주세요.</p>
      </div>
    );
  }

  return (
    <div className="container page narrow stack">
      <h1 className="page-title">주문이 완료됐어요</h1>
      <div className="panel stack-sm">
        <p>
          주문번호 <strong>{order.orderNumber}</strong>
        </p>
        <p>{order.orderName}</p>
        <p>
          결제 금액 <strong>{formatPrice(order.total)}</strong>
        </p>
        <p className="small muted">
          {order.shipping.recipient} · ({order.shipping.postalCode}) {order.shipping.address1} {order.shipping.address2}
        </p>
      </div>
      <div className="row">
        <Link className="btn" href={`/mypage/orders/${order.orderNumber}`}>
          주문 상세 보기
        </Link>
        <Link className="btn btn-outline" href="/">
          쇼핑 계속하기
        </Link>
      </div>
    </div>
  );
}

export function PaymentFail() {
  const params = useSearchParams();
  const code = params.get("code") ?? undefined;
  const message = params.get("message") ?? "결제가 취소되었거나 실패했어요.";
  const orderNumber = params.get("orderId");
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current || !orderNumber) return;
    sent.current = true;
    paymentApi.fail({ orderNumber, code, message }).catch(() => {});
  }, [orderNumber, code, message]);

  return (
    <div className="container page narrow stack">
      <h1 className="page-title">결제하지 못했어요</h1>
      <p className="form-error">{message}</p>
      <p className="small muted">장바구니는 그대로 남아 있어요. 다시 시도해주세요.</p>
      <div className="row">
        <Link className="btn" href="/checkout">
          다시 결제하기
        </Link>
        <Link className="btn btn-outline" href="/cart">
          장바구니로
        </Link>
      </div>
    </div>
  );
}
