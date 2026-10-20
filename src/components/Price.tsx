import type { Product } from '../domain/types';
import { formatKRW } from '../lib/format';
import { discountPercent } from '../lib/pricing';

export function Price({ product, className = '' }: { product: Pick<Product, 'price' | 'originalPrice'>; className?: string }) {
  const pct = discountPercent(product);
  return (
    <p className={`price ${className}`}>
      <span>
        <span className="sr-only">{pct ? '할인가 ' : '가격 '}</span>
        {formatKRW(product.price)}
      </span>
      {pct > 0 && product.originalPrice && (
        <>
          <s>
            <span className="sr-only">정상가 </span>
            {formatKRW(product.originalPrice)}
          </s>
          <span className="pct">{pct}%</span>
        </>
      )}
    </p>
  );
}
