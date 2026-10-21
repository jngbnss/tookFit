import Link from "next/link";
import { ProductGrid } from "@/components/ProductCard";
import { serverGetOr } from "@/lib/api/server";
import type { Banner, Category, Page, ProductSummary } from "@/lib/api/types";

const emptyPage: Page<ProductSummary> = { items: [], page: 0, size: 0, totalElements: 0, totalPages: 0 };

export default async function HomePage() {
  const [hero, middle, categories, newest, best] = await Promise.all([
    serverGetOr<Banner[]>("/banners", [], { position: "MAIN_HERO" }),
    serverGetOr<Banner[]>("/banners", [], { position: "MAIN_MIDDLE" }),
    serverGetOr<Category[]>("/categories", []),
    serverGetOr<Page<ProductSummary>>("/products", emptyPage, { collection: "new-arrivals", sort: "newest", size: 8 }),
    serverGetOr<Page<ProductSummary>>("/products", emptyPage, { collection: "best-sellers", sort: "featured", size: 8 }),
  ]);
  const main = hero[0];

  return (
    <>
      <section className="hero" aria-label="메인 배너">
        {main?.imageUrl && (
          <picture>
            {main.mobileImageUrl && <source media="(max-width: 720px)" srcSet={main.mobileImageUrl} />}
            <img src={main.imageUrl} alt="" fetchPriority="high" />
          </picture>
        )}
        <div className={`hero-copy ${main?.imageUrl ? "" : "hero-empty"}`}>
          <h1>{main?.title ?? "이번 시즌 새로 들어온 옷"}</h1>
          {(main?.subtitle ?? "매일 입기 좋은 기본 아이템") && <p>{main?.subtitle ?? "매일 입기 좋은 기본 아이템"}</p>}
          <Link className="btn" href={main?.linkUrl ?? "/shop/new-arrivals"}>
            쇼핑하기
          </Link>
        </div>
      </section>

      <div className="container">
        <section className="section">
          <div className="section-head">
            <h2>신상품</h2>
            <Link className="link small" href="/shop/new-arrivals">
              전체 보기
            </Link>
          </div>
          <ProductGrid products={newest.items} eagerCount={4} />
        </section>

        {middle.length > 0 && (
          <section className="section mid-banner" aria-label="기획전">
            {middle.map((b) => (
              <a key={b.id} href={b.linkUrl ?? "#"}>
                {b.imageUrl && <img src={b.imageUrl} alt="" loading="lazy" />}
                <div className="copy">
                  {b.title && <h3>{b.title}</h3>}
                  {b.subtitle && <p className="small">{b.subtitle}</p>}
                </div>
              </a>
            ))}
          </section>
        )}

        <section className="section">
          <div className="section-head">
            <h2>베스트</h2>
            <Link className="link small" href="/shop/best-sellers">
              전체 보기
            </Link>
          </div>
          <ProductGrid products={best.items} />
        </section>

        {categories.length > 0 && (
          <section className="section" style={{ marginBottom: 96 }}>
            <div className="section-head">
              <h2>카테고리</h2>
            </div>
            <div className="category-tiles">
              {categories.map((c) => (
                <Link key={c.id} href={`/shop/${c.slug}`}>
                  {c.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
