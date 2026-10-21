import { discountRate, formatPrice } from "@/lib/format";

export function Price({ price, originalPrice }: { price: number; originalPrice?: number | null }) {
  const rate = discountRate(price, originalPrice);
  return (
    <p className="price">
      {rate > 0 && <span className="rate">{rate}%</span>}
      <span>{formatPrice(price)}</span>
      {rate > 0 && (
        <del>
          <span className="sr-only">정가 </span>
          {formatPrice(originalPrice)}
        </del>
      )}
    </p>
  );
}

export function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="stars" aria-label={`5점 만점에 ${value.toFixed(1)}점`}>
      {"★".repeat(full)}
      {"☆".repeat(5 - full)}
    </span>
  );
}
