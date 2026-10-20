import { getProduct } from '../lib/catalog';
import { useStore } from '../state/store';
import { ProductGrid } from './ProductCard';
import type { Product } from '../domain/types';

export function RecentlyViewed({ excludeId, title = '최근 본 상품' }: { excludeId?: string; title?: string }) {
  const { recent } = useStore();
  const products = recent
    .filter((id) => id !== excludeId)
    .map(getProduct)
    .filter((p): p is Product => !!p)
    .slice(0, 4);
  if (!products.length) return null;
  return (
    <section className="section container" aria-labelledby="recent-title">
      <div className="section-head">
        <h2 id="recent-title">{title}</h2>
      </div>
      <ProductGrid products={products} />
    </section>
  );
}
