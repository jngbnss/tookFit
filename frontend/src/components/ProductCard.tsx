"use client";

import Link from "next/link";
import type { ProductSummary } from "@/lib/api/types";
import { BADGE_LABEL } from "@/lib/format";
import { HeartIcon } from "./Icons";
import { Price } from "./Price";
import { useWishlist } from "./providers/Wishlist";

export function ProductCard({ product, eager = false }: { product: ProductSummary; eager?: boolean }) {
  const wishlist = useWishlist();
  const wished = wishlist.has(product.id);
  const href = `/products/${product.slug}`;

  return (
    <article className="card">
      <Link href={href} className="card-media" aria-label={product.name}>
        {product.thumbnailUrl ? (
          <img src={product.thumbnailUrl} alt="" loading={eager ? "eager" : "lazy"} width={800} height={1000} />
        ) : null}
        {product.hoverImageUrl && (
          <img className="hover-img" src={product.hoverImageUrl} alt="" loading="lazy" width={800} height={1000} />
        )}
        {product.badge && (
          <span className={`card-badge ${product.badge === "SALE" ? "sale" : ""}`}>{BADGE_LABEL[product.badge]}</span>
        )}
        {!product.inStock && <span className="card-soldout">품절</span>}
      </Link>
      <button
        type="button"
        className="icon-btn card-wish"
        aria-pressed={wished}
        aria-label={wished ? `${product.name} 위시리스트에서 빼기` : `${product.name} 위시리스트에 담기`}
        onClick={() => wishlist.toggle(product.id, product.name)}
      >
        <HeartIcon filled={wished} />
      </button>
      <div className="card-info">
        <h3 className="card-name">
          <Link href={href}>{product.name}</Link>
        </h3>
        <Price price={product.price} originalPrice={product.originalPrice} />
        {product.rating.count > 0 && (
          <p className="rating">
            ★ {product.rating.average.toFixed(1)} ({product.rating.count})
          </p>
        )}
        {product.colors.length > 0 && (
          <div className="swatches" aria-label={`색상: ${product.colors.map((c) => c.name).join(", ")}`}>
            {product.colors.map((c) => (
              <span key={c.id} className="swatch-dot" style={{ background: c.hex }} title={c.name} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ products, eagerCount = 0 }: { products: ProductSummary[]; eagerCount?: number }) {
  if (!products.length) return <p className="empty">상품이 없어요.</p>;
  return (
    <ul className="grid">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} eager={i < eagerCount} />
        </li>
      ))}
    </ul>
  );
}
