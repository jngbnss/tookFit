"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AddressFields, EMPTY_ADDRESS, validateAddress, type AddressValue } from "@/components/AddressFields";
import { CartLine } from "@/components/cart/CartLine";
import { OrderSummaryPanel } from "@/components/cart/OrderSummaryPanel";
import { BUY_NOW_KEY } from "@/components/product/ProductView";
import { useAuth } from "@/components/providers/Auth";
import { useCart } from "@/components/providers/Cart";
import { useAsync } from "@/hooks/useAsync";
import { errorMessage, isApiError } from "@/lib/api/client";
import { addressApi } from "@/lib/api/me";
import { orderApi } from "@/lib/api/orders";
import type { Address, OrderItemInput, OrderPreview } from "@/lib/api/types";
import { requestTossPayment } from "@/lib/external-scripts";

const MEMOS = ["", "문 앞에 놓아주세요", "경비실에 맡겨주세요", "배송 전 연락 부탁드려요", "택배함에 넣어주세요"];

function readBuyNow(): OrderItemInput[] | null {
  try {
    const raw = sessionStorage.getItem(BUY_NOW_KEY);
    const items = raw ? (JSON.parse(raw) as OrderItemInput[]) : null;
    return Array.isArray(items) && items.length ? items : null;
  } catch {
    return null;
  }
}

function toValue(a: Address): AddressValue {
  return { recipient: a.recipient, phone: a.phone, postalCode: a.postalCode, address1: a.address1, address2: a.address2 ?? "" };
}

export function CheckoutView() {
  const router = useRouter();
  const search = useSearchParams();
  const { me } = useAuth();
  const cart = useCart();
  const buyNowMode = search.get("mode") === "buy-now";

  const [buyNowItems, setBuyNowItems] = useState<OrderItemInput[] | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage는 마운트 후에만 읽을 수 있다
    if (buyNowMode) setBuyNowItems(readBuyNow());
  }, [buyNowMode]);

  const items: OrderItemInput[] = useMemo(() => {
    if (buyNowMode) return buyNowItems ?? [];
    return cart.items.filter((i) => i.available).map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
  }, [buyNowMode, buyNowItems, cart.items]);
  const itemsKey = JSON.stringify(items);

  const addresses = useAsync(() => addressApi.list(), []);
  const [selectedId, setSelectedId] = useState<number | "new" | null>(null);
  const [address, setAddress] = useState<AddressValue>(EMPTY_ADDRESS);
  const [saveAddress, setSaveAddress] = useState(true);
  const [addressErrors, setAddressErrors] = useState<Partial<Record<keyof AddressValue, string>>>({});
  const [memo, setMemo] = useState("");
  const [customMemo, setCustomMemo] = useState("");

  // 배송지 목록을 받으면 기본 배송지를 한 번 선택한다 (렌더링 중 상태 조정)
  if (selectedId === null && (addresses.data || addresses.error)) {
    const list = addresses.data ?? [];
    const def = list.find((a) => a.isDefault) ?? list[0];
    if (def) {
      setSelectedId(def.id);
      setAddress(toValue(def));
    } else {
      setSelectedId("new");
      setAddress({ ...EMPTY_ADDRESS, recipient: me?.name ?? "", phone: me?.phone ?? "" });
    }
  }

  const [couponInput, setCouponInput] = useState("");
  const [couponCode, setCouponCode] = useState<string | undefined>();
  const [preview, setPreview] = useState<OrderPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    const list = JSON.parse(itemsKey) as OrderItemInput[];
    if (!list.length) return;
    let alive = true;
    orderApi
      .preview({ items: list, couponCode })
      .then((p) => {
        if (!alive) return;
        setPreview(p);
        setPreviewError(null);
      })
      .catch((e) => alive && setPreviewError(errorMessage(e)));
    return () => {
      alive = false;
    };
  }, [itemsKey, couponCode]);

  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const waitingForItems = buyNowMode ? buyNowItems === null : cart.loading;
  if (!waitingForItems && items.length === 0) {
    return (
      <div className="container page">
        <h1 className="page-title">주문서</h1>
        <div className="empty stack" style={{ alignItems: "center" }}>
          <p>주문할 상품이 없어요.</p>
          <Link className="btn" href="/cart">
            장바구니로 가기
          </Link>
        </div>
      </div>
    );
  }

  const submit = async () => {
    setSubmitError(null);
    const errs = validateAddress(address);
    setAddressErrors(errs);
    if (Object.keys(errs).length) return setSubmitError("배송지 정보를 확인해주세요.");
    if (!agree) return setSubmitError("주문 내용 확인 및 결제 동의에 체크해주세요.");
    if (!preview || preview.items.every((i) => !i.available)) return setSubmitError("주문할 수 있는 상품이 없어요.");

    setSubmitting(true);
    try {
      const order = await orderApi.create({
        items,
        couponCode: preview.coupon ? couponCode : undefined,
        shipping: {
          recipient: address.recipient.trim(),
          phone: address.phone.trim(),
          postalCode: address.postalCode,
          address1: address.address1,
          address2: address.address2.trim() || undefined,
        },
        saveAddress: selectedId === "new" && saveAddress,
        deliveryMemo: (memo === "custom" ? customMemo : memo).trim() || undefined,
        fromCart: !buyNowMode,
      });
      if (buyNowMode) sessionStorage.removeItem(BUY_NOW_KEY);

      if (order.payment.provider === "TOSS" && order.payment.clientKey) {
        // 결제창으로 이동한다. 결과는 /checkout/success 또는 /checkout/fail 로 돌아온다
        await requestTossPayment({
          clientKey: order.payment.clientKey,
          customerKey: order.payment.customerKey,
          orderId: order.orderNumber,
          orderName: order.orderName,
          amount: order.amount,
          customerName: order.customer.name,
          customerEmail: order.customer.email,
          customerPhone: order.customer.phone,
        });
      } else {
        // 모의 결제: 결제창 없이 성공 화면으로 간다 (서버가 금액을 똑같이 검증한다)
        const key = `mock_${crypto.randomUUID?.() ?? Date.now().toString(36)}`;
        router.replace(`/checkout/success?paymentKey=${encodeURIComponent(key)}&orderId=${encodeURIComponent(order.orderNumber)}&amount=${order.amount}`);
      }
    } catch (e) {
      // 토스 결제창을 사용자가 닫으면 에러가 나므로 메시지만 보여준다
      setSubmitError(!isApiError(e) && e instanceof Error ? e.message : errorMessage(e));
      setSubmitting(false);
    }
  };

  return (
    <div className="container page">
      <h1 className="page-title">주문서</h1>
      <div className="two-col">
        <div className="stack" style={{ gap: 24 }}>
          <section className="panel">
            <h2 className="panel-title">주문 상품</h2>
            {previewError && <p className="form-error">{previewError}</p>}
            {!preview && !previewError && <div className="skeleton" style={{ height: 96 }} />}
            <ul>{preview?.items.map((i) => <CartLine key={`${i.variantId}`} item={i} />)}</ul>
          </section>

          <section className="panel">
            <h2 className="panel-title">주문자</h2>
            <p className="small">
              {me?.name} · {me?.phone ?? "연락처 미등록"} · {me?.email ?? "이메일 미등록"}
            </p>
          </section>

          <section className="panel stack">
            <h2 className="panel-title" style={{ marginBottom: 0 }}>
              배송지
            </h2>
            {addresses.data && addresses.data.length > 0 && (
              <div className="stack-sm">
                {addresses.data.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="address-card"
                    style={{ textAlign: "left" }}
                    aria-pressed={selectedId === a.id}
                    onClick={() => {
                      setSelectedId(a.id);
                      setAddress(toValue(a));
                      setAddressErrors({});
                    }}
                  >
                    <strong>
                      {a.label ?? a.recipient}
                      {a.isDefault && <span className="muted small"> (기본)</span>}
                    </strong>
                    <br />
                    {a.recipient} · {a.phone}
                    <br />
                    <span className="muted">
                      ({a.postalCode}) {a.address1} {a.address2}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  className="address-card"
                  style={{ textAlign: "left" }}
                  aria-pressed={selectedId === "new"}
                  onClick={() => {
                    setSelectedId("new");
                    setAddress({ ...EMPTY_ADDRESS, recipient: me?.name ?? "", phone: me?.phone ?? "" });
                  }}
                >
                  + 새 배송지 입력
                </button>
              </div>
            )}
            {selectedId === "new" && (
              <>
                <AddressFields value={address} onChange={setAddress} errors={addressErrors} />
                <label className="check">
                  <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                  배송지 목록에 저장
                </label>
              </>
            )}
            {addressErrors.address1 && selectedId !== "new" && <p className="field-error">{addressErrors.address1}</p>}
            <label className="field">
              <span>배송 메모</span>
              <select className="select" value={memo} onChange={(e) => setMemo(e.target.value)}>
                {MEMOS.map((m) => (
                  <option key={m} value={m}>
                    {m || "선택 안 함"}
                  </option>
                ))}
                <option value="custom">직접 입력</option>
              </select>
              {memo === "custom" && <input className="input" maxLength={100} value={customMemo} onChange={(e) => setCustomMemo(e.target.value)} placeholder="배송 메모 (100자 이내)" />}
            </label>
          </section>

          <section className="panel stack">
            <h2 className="panel-title" style={{ marginBottom: 0 }}>
              쿠폰
            </h2>
            <form
              className="row"
              style={{ flexWrap: "nowrap" }}
              onSubmit={(e) => {
                e.preventDefault();
                setCouponCode(couponInput.trim().toUpperCase() || undefined);
              }}
            >
              <input className="input" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="쿠폰 코드" aria-label="쿠폰 코드" />
              <button className="btn btn-ghost" style={{ height: 44 }}>
                적용
              </button>
            </form>
            {preview?.coupon && (
              <p className="small success">
                {preview.coupon.name} 적용 ·{" "}
                <button
                  type="button"
                  className="link"
                  onClick={() => {
                    setCouponCode(undefined);
                    setCouponInput("");
                  }}
                >
                  취소
                </button>
              </p>
            )}
            {preview?.couponError && <p className="field-error">{preview.couponError}</p>}
          </section>
        </div>

        <OrderSummaryPanel totals={preview?.totals ?? cart.totals}>
          <label className="check">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            주문 상품, 가격, 배송 정보를 확인했으며 결제에 동의합니다.
          </label>
          {submitError && (
            <p className="form-error" role="alert">
              {submitError}
            </p>
          )}
          <button type="button" className="btn btn-block" onClick={submit} disabled={submitting || !preview}>
            {submitting ? "처리 중…" : preview ? `결제하기` : "금액 계산 중…"}
          </button>
        </OrderSummaryPanel>
      </div>
    </div>
  );
}
