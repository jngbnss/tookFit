import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogFilters, SortSelect } from "@/components/catalog/CatalogFilters";
import { Pagination } from "@/components/Pagination";
import { ProductGrid } from "@/components/ProductCard";
import { serverGet, serverGetOr } from "@/lib/api/server";
import type { Category, Collection, Page, ProductSummary, SortKey } from "@/lib/api/types";

type Props = {
  params: Promise<{ collection: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const COLLECTION_TITLE: Record<Collection, string> = {
  all: "전체 상품",
  "new-arrivals": "신상품",
  "best-sellers": "베스트",
  sale: "세일",
};
const SORTS: SortKey[] = ["featured", "newest", "price-asc", "price-desc"];

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const list = (v: string | string[] | undefined) =>
  (one(v) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const num = (v: string | string[] | undefined) => {
  const n = Number(one(v));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

async function resolveTitle(collection: string, categories: Category[]) {
  if (collection in COLLECTION_TITLE) return COLLECTION_TITLE[collection as Collection];
  return categories.find((c) => c.slug === collection)?.name;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { collection } = await params;
  const q = one((await searchParams).q);
  const categories = await serverGetOr<Category[]>("/categories", []);
  const title = (await resolveTitle(collection, categories)) ?? "상품";
  return { title: q ? `'${q}' 검색 결과` : title, alternates: { canonical: `/shop/${collection}` } };
}

export default async function CatalogPage({ params, searchParams }: Props) {
  const { collection } = await params;
  const sp = await searchParams;
  const categories = await serverGetOr<Category[]>("/categories", []);
  const isCollection = collection in COLLECTION_TITLE;
  const category = isCollection ? undefined : categories.find((c) => c.slug === collection);
  if (!isCollection && !category) notFound();

  const q = one(sp.q)?.trim() || undefined;
  const sortParam = one(sp.sort) as SortKey | undefined;
  const sort = sortParam && SORTS.includes(sortParam) ? sortParam : q ? "featured" : "featured";
  const page = Math.max(0, (num(sp.page) ?? 1) - 1);

  const data = await serverGet<Page<ProductSummary>>("/products", {
    q,
    collection: isCollection ? collection : "all",
    category: category?.slug,
    sizes: list(sp.sizes),
    colors: list(sp.colors),
    minPrice: num(sp.minPrice),
    maxPrice: num(sp.maxPrice),
    inStock: one(sp.inStock) === "true" || undefined,
    sort,
    page,
    size: 24,
  });

  const title = q ? `'${q}' 검색 결과` : (category?.name ?? COLLECTION_TITLE[collection as Collection]);
  const makeHref = (p: number) => {
    const next = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => {
      const val = one(v);
      if (val && k !== "page") next.set(k, val);
    });
    if (p > 0) next.set("page", String(p + 1));
    const s = next.toString();
    return `/shop/${collection}${s ? `?${s}` : ""}`;
  };

  // 색상 필터 후보: 이번 결과에 있는 색상 이름 (전체 목록 API가 없어서 결과에서 모은다)
  const colorNames = Array.from(new Map(data.items.flatMap((p) => p.colors).map((c) => [c.name, c])).values());

  return (
    <div className="container page">
      <h1 className="page-title">{title}</h1>
      <div className="catalog">
        <CatalogFilters basePath={`/shop/${collection}`} colors={colorNames} />
        <div>
          <div className="toolbar">
            <span className="muted">{data.totalElements.toLocaleString()}개 상품</span>
            <SortSelect value={sort} />
          </div>
          {data.items.length === 0 ? (
            <div className="empty">
              조건에 맞는 상품이 없어요.
              <br />
              필터를 줄이거나 다른 검색어를 입력해보세요.
            </div>
          ) : (
            <ProductGrid products={data.items} eagerCount={4} />
          )}
          <Pagination page={data.page} totalPages={data.totalPages} href={makeHref} />
        </div>
      </div>
    </div>
  );
}
