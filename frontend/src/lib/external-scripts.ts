// 외부 스크립트(우편번호 검색, 토스페이먼츠 SDK)를 필요할 때 한 번만 불러온다.

const loaded = new Map<string, Promise<void>>();

export function loadScript(src: string): Promise<void> {
  const existing = loaded.get(src);
  if (existing) return existing;
  const p = new Promise<void>((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => {
      loaded.delete(src);
      reject(new Error(`스크립트를 불러오지 못했어요: ${src}`));
    };
    document.head.appendChild(el);
  });
  loaded.set(src, p);
  return p;
}

// ── 다음(카카오) 우편번호 ───────────────────────────────

const POSTCODE_SRC = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

type PostcodeData = { zonecode: string; roadAddress: string; jibunAddress: string; address: string; buildingName: string; apartment: "Y" | "N" };
type DaumGlobal = { Postcode: new (opts: { oncomplete: (d: PostcodeData) => void }) => { open: () => void } };

export async function openPostcode(): Promise<{ postalCode: string; address1: string } | null> {
  await loadScript(POSTCODE_SRC);
  const daum = (window as unknown as { daum?: DaumGlobal }).daum;
  if (!daum) throw new Error("우편번호 검색을 불러오지 못했어요.");
  return new Promise((resolve) => {
    new daum.Postcode({
      oncomplete: (d) => {
        const extra = d.buildingName && d.apartment === "Y" ? ` (${d.buildingName})` : "";
        resolve({ postalCode: d.zonecode, address1: (d.roadAddress || d.address) + extra });
      },
    }).open();
  });
}

// ── 토스페이먼츠 SDK v2 ───────────────────────────────

const TOSS_SRC = "https://js.tosspayments.com/v2/standard";

type TossPayment = {
  requestPayment: (opts: {
    method: "CARD";
    amount: { currency: "KRW"; value: number };
    orderId: string;
    orderName: string;
    successUrl: string;
    failUrl: string;
    customerName?: string;
    customerEmail?: string;
    customerMobilePhone?: string;
    card?: { useEscrow?: boolean; flowMode?: "DEFAULT" | "DIRECT"; useCardPoint?: boolean; useAppCardOnly?: boolean };
  }) => Promise<void>;
};
type TossGlobal = (clientKey: string) => { payment: (opts: { customerKey: string }) => TossPayment };

export async function requestTossPayment(opts: {
  clientKey: string;
  customerKey: string;
  orderId: string;
  orderName: string;
  amount: number;
  customerName?: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
}) {
  await loadScript(TOSS_SRC);
  const TossPayments = (window as unknown as { TossPayments?: TossGlobal }).TossPayments;
  if (!TossPayments) throw new Error("결제 모듈을 불러오지 못했어요.");
  const origin = window.location.origin;
  const payment = TossPayments(opts.clientKey).payment({ customerKey: opts.customerKey });
  await payment.requestPayment({
    method: "CARD",
    amount: { currency: "KRW", value: opts.amount },
    orderId: opts.orderId,
    orderName: opts.orderName,
    successUrl: `${origin}/checkout/success`,
    failUrl: `${origin}/checkout/fail`,
    customerName: opts.customerName,
    customerEmail: opts.customerEmail ?? undefined,
    customerMobilePhone: opts.customerPhone?.replace(/\D/g, "") || undefined,
    card: { useEscrow: false, flowMode: "DEFAULT", useCardPoint: false, useAppCardOnly: false },
  });
}
