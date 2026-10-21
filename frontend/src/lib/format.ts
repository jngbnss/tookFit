import type {
  Badge,
  ClaimReason,
  ClaimStatus,
  ClaimType,
  FitFeedback,
  OrderStatus,
  Page,
  ProductStatus,
} from "./api/types";

const won = new Intl.NumberFormat("ko-KR");

/** 289000 → "289,000원" */
export function formatPrice(value: number | null | undefined): string {
  return `${won.format(Math.round(value ?? 0))}원`;
}

/** ISO 문자열 → "2026.10.21" */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

/** ISO 문자열 → "2026.10.21 14:05" */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${formatDate(iso)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

export function discountRate(price: number, originalPrice?: number | null): number {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round((1 - price / originalPrice) * 100);
}

/** 백엔드가 목록을 배열이나 Page로 줄 수 있는 관리자 API를 같은 방식으로 다룬다. */
export function asItems<T>(data: T[] | Page<T> | null | undefined): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.items;
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "결제 대기",
  PAID: "결제 완료",
  PREPARING: "배송 준비중",
  SHIPPED: "배송중",
  DELIVERED: "배송 완료",
  CANCELLED: "주문 취소",
  EXPIRED: "결제 기한 만료",
};

export const BADGE_LABEL: Record<Badge, string> = {
  NEW: "NEW",
  BEST: "BEST",
  LIMITED: "LIMITED",
  SALE: "SALE",
};

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  DRAFT: "임시저장",
  ACTIVE: "판매중",
  HIDDEN: "숨김",
};

export const CLAIM_TYPE_LABEL: Record<ClaimType, string> = { RETURN: "반품", EXCHANGE: "교환" };

export const CLAIM_REASON_LABEL: Record<ClaimReason, string> = {
  CHANGE_OF_MIND: "단순 변심",
  SIZE: "사이즈가 맞지 않음",
  DEFECT: "상품 불량",
  WRONG_ITEM: "오배송",
};

export const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = {
  REQUESTED: "접수",
  APPROVED: "승인",
  REJECTED: "거절",
  COMPLETED: "완료",
};

export const FIT_LABEL: Record<FitFeedback, string> = { SMALL: "작아요", TRUE: "정사이즈", LARGE: "커요" };

export const CARRIERS = [
  { value: "CJ", label: "CJ대한통운" },
  { value: "HANJIN", label: "한진택배" },
  { value: "LOTTE", label: "롯데택배" },
  { value: "POST", label: "우체국택배" },
  { value: "LOGEN", label: "로젠택배" },
] as const;

/** "김민수" → "김**" (백엔드가 이미 마스킹해 보내지만 방어적으로 한 번 더) */
export function maskName(name: string): string {
  if (!name) return "";
  if (name.includes("*")) return name;
  return name[0] + "*".repeat(Math.max(1, name.length - 1));
}
