"use client";

import Link from "next/link";
import type { CartItem } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { useSettings } from "../providers/Settings";

export function CartLine({
  item,
  disabled,
  onQuantity,
  onRemove,
}: {
  item: CartItem;
  disabled?: boolean;
  onQuantity?: (q: number) => void;
  onRemove?: () => void;
}) {
  const { maxQuantityPerItem } = useSettings();
  const max = Math.max(1, Math.min(maxQuantityPerItem, item.stock || 1));
  return (
    <li className="line-item" style={{ opacity: item.available ? 1 : 0.55 }}>
      <Link href={`/products/${item.productSlug}`} tabIndex={-1} aria-hidden="true">
        {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <div className="ph" />}
      </Link>
      <div className="stack-sm" style={{ gap: 4 }}>
        <Link href={`/products/${item.productSlug}`} className="name">
          {item.productName}
        </Link>
        <span className="opt">
          {item.colorName} / {item.size}
        </span>
        {!item.available && <span className="small accent">품절</span>}
        {onQuantity && item.available && (
          <div className="qty" style={{ height: 32, marginTop: 4, alignSelf: "flex-start" }}>
            <button type="button" disabled={disabled || item.quantity <= 1} onClick={() => onQuantity(item.quantity - 1)} aria-label="수량 줄이기">
              −
            </button>
            <span>{item.quantity}</span>
            <button type="button" disabled={disabled || item.quantity >= max} onClick={() => onQuantity(item.quantity + 1)} aria-label="수량 늘리기">
              +
            </button>
          </div>
        )}
        {!onQuantity && <span className="opt">수량 {item.quantity}개</span>}
      </div>
      <div className="stack-sm" style={{ alignItems: "flex-end", gap: 6 }}>
        <strong className="small">{formatPrice(item.lineTotal)}</strong>
        {onRemove && (
          <button type="button" className="link small muted" onClick={onRemove} disabled={disabled}>
            삭제
          </button>
        )}
      </div>
    </li>
  );
}
