import type { MetadataRoute } from "next";
import { serverGetOr, siteUrl } from "@/lib/api/server";
import type { Category, Page, ProductSummary } from "@/lib/api/types";

// 도메인(SITE_URL)과 상품 목록을 요청 시점에 읽는다
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const empty: Page<ProductSummary> = { items: [], page: 0, size: 0, totalElements: 0, totalPages: 0 };
  const [categories, first] = await Promise.all([
    serverGetOr<Category[]>("/categories", []),
    serverGetOr<Page<ProductSummary>>("/products", empty, { size: 60, page: 0, sort: "newest" }),
  ]);
  const products = [...first.items];
  for (let p = 1; p < Math.min(first.totalPages, 20); p++) {
    const page = await serverGetOr<Page<ProductSummary>>("/products", empty, { size: 60, page: p, sort: "newest" });
    products.push(...page.items);
  }

  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    ...["all", "new-arrivals", "best-sellers", "sale"].map((c) => ({ url: `${base}/shop/${c}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...categories.map((c) => ({ url: `${base}/shop/${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    { url: `${base}/notices`, changeFrequency: "weekly", priority: 0.3 },
  ];
}
