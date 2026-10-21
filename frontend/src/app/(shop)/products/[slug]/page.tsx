import type { Metadata } from "next";
import { ProductReviews } from "@/components/product/ProductReviews";
import { ProductView } from "@/components/product/ProductView";
import { ProductGrid } from "@/components/ProductCard";
import { serverGetOr, serverGetOr404, siteUrl } from "@/lib/api/server";
import type { ProductDetail, ProductSummary } from "@/lib/api/types";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await serverGetOr<ProductDetail | null>(`/products/${encodeURIComponent(slug)}`, null);
  if (!p) return { title: "상품을 찾을 수 없어요" };
  const description = (p.description ?? `${p.name} — ${p.category.name}`).slice(0, 150);
  return {
    title: p.name,
    description,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: {
      title: p.name,
      description,
      images: p.thumbnailUrl ? [{ url: p.thumbnailUrl }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await serverGetOr404<ProductDetail>(`/products/${encodeURIComponent(slug)}`);
  const related = await serverGetOr<ProductSummary[]>(`/products/${encodeURIComponent(slug)}/related`, []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.images.map((i) => i.url),
    sku: product.variants[0]?.sku,
    category: product.category.name,
    url: `${siteUrl()}/products/${product.slug}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "KRW",
      price: product.price,
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${siteUrl()}/products/${product.slug}`,
    },
    ...(product.rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating.average,
            reviewCount: product.rating.count,
          },
        }
      : {}),
  };

  return (
    <div className="container page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ProductView product={product} />
      <section className="section" id="reviews">
        <ProductReviews slug={product.slug} />
      </section>
      {related.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>함께 보면 좋은 상품</h2>
          </div>
          <ProductGrid products={related.slice(0, 8)} />
        </section>
      )}
    </div>
  );
}
