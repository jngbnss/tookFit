import { api, type QueryValue } from "./client";
import type {
  Category,
  Page,
  ProductDetail,
  ProductQuery,
  ProductReviews,
  ProductSummary,
  Review,
  ReviewRequest,
  ReviewableItem,
  Suggestion,
} from "./types";

export function productQueryParams(q: ProductQuery): Record<string, QueryValue> {
  return {
    q: q.q,
    collection: q.collection,
    category: q.category,
    sizes: q.sizes,
    colors: q.colors,
    minPrice: q.minPrice,
    maxPrice: q.maxPrice,
    inStock: q.inStock || undefined,
    sort: q.sort,
    page: q.page,
    size: q.size,
  };
}

export const catalogApi = {
  categories: () => api.get<Category[]>("/categories"),
  products: (q: ProductQuery) => api.get<Page<ProductSummary>>("/products", productQueryParams(q)),
  suggestions: (q: string) => api.get<Suggestion[]>("/products/suggestions", { q }),
  product: (slug: string) => api.get<ProductDetail>(`/products/${encodeURIComponent(slug)}`),
  related: (slug: string) => api.get<ProductSummary[]>(`/products/${encodeURIComponent(slug)}/related`),
  reviews: (slug: string, page = 0, sort: "newest" | "rating" = "newest") =>
    api.get<ProductReviews>(`/products/${encodeURIComponent(slug)}/reviews`, { page, size: 10, sort }),
};

export type MyReview = Review & { productName?: string | null; productSlug?: string | null };

export const reviewApi = {
  reviewable: () => api.get<ReviewableItem[]>("/me/reviewable-items"),
  mine: (page = 0) => api.get<Page<MyReview>>("/me/reviews", { page }),
  create: (body: ReviewRequest) => api.post<Review>("/reviews", body),
  update: (id: number, body: Partial<ReviewRequest>) => api.patch<Review>(`/reviews/${id}`, body),
  remove: (id: number) => api.delete<void>(`/reviews/${id}`),
};
