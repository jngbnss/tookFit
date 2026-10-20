import { PRODUCTS } from '../data/products';
import type { CatalogQuery, CategorySlug, CollectionSlug, Product, SortKey } from '../domain/types';
import { isInStock } from './pricing';

const byId = new Map(PRODUCTS.map((p) => [p.id, p]));
const bySlug = new Map(PRODUCTS.map((p) => [p.slug, p]));

export const getProduct = (id: string) => byId.get(id);
export const getProductBySlug = (slug: string) => bySlug.get(slug);

export const NEW_ARRIVALS_SINCE = '2026-09-25';

export function inCollection(p: Product, collection: CollectionSlug): boolean {
  switch (collection) {
    case 'all':
      return true;
    case 'new-arrivals':
      return p.badge === 'NEW' || p.createdAt >= NEW_ARRIVALS_SINCE;
    case 'best-sellers':
      return p.badge === 'BEST';
    case 'sale':
      return !!p.originalPrice && p.originalPrice > p.price;
    default:
      return p.category === collection;
  }
}

export function matchesSearch(p: Product, q: string): boolean {
  const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const hay = `${p.name} ${p.category} ${p.description} ${p.colors.map((c) => c.name).join(' ')}`.toLowerCase();
  return terms.every((t) => hay.includes(t));
}

export function sortProducts(list: Product[], sort: SortKey): Product[] {
  const copy = [...list];
  switch (sort) {
    case 'newest':
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.featuredRank - b.featuredRank);
    case 'price-asc':
      return copy.sort((a, b) => a.price - b.price || a.featuredRank - b.featuredRank);
    case 'price-desc':
      return copy.sort((a, b) => b.price - a.price || a.featuredRank - b.featuredRank);
    default:
      return copy.sort((a, b) => a.featuredRank - b.featuredRank);
  }
}

function hasAvailableVariant(p: Product, sizes: string[], colors: string[]): boolean {
  return p.colors.some(
    (c) =>
      (!colors.length || colors.includes(c.id)) &&
      p.sizes.some((s) => (!sizes.length || sizes.includes(s)) && (p.stock[c.id]?.[s] ?? 0) > 0),
  );
}

export function filterProducts(products: Product[], q: CatalogQuery): Product[] {
  const result = products.filter((p) => {
    if (!inCollection(p, q.collection)) return false;
    if (!matchesSearch(p, q.q)) return false;
    if (q.categories.length && !q.categories.includes(p.category)) return false;
    if (q.sizes.length && !p.sizes.some((s) => q.sizes.includes(s))) return false;
    if (q.colors.length && !p.colors.some((c) => q.colors.includes(c.id))) return false;
    if (q.minPrice != null && p.price < q.minPrice) return false;
    if (q.maxPrice != null && p.price > q.maxPrice) return false;
    if (q.inStock) {
      const available = q.sizes.length || q.colors.length ? hasAvailableVariant(p, q.sizes, q.colors) : isInStock(p);
      if (!available) return false;
    }
    return true;
  });
  return sortProducts(result, q.sort);
}

export const DEFAULT_QUERY: CatalogQuery = {
  q: '',
  collection: 'all',
  categories: [],
  sizes: [],
  colors: [],
  minPrice: null,
  maxPrice: null,
  inStock: false,
  sort: 'featured',
};

const SORTS: SortKey[] = ['featured', 'newest', 'price-asc', 'price-desc'];

export function queryFromParams(params: URLSearchParams, collection: CollectionSlug): CatalogQuery {
  const list = (key: string) => (params.get(key) ?? '').split(',').filter(Boolean);
  const num = (key: string) => {
    const v = params.get(key);
    return v && !Number.isNaN(Number(v)) ? Number(v) : null;
  };
  const sort = params.get('sort') as SortKey | null;
  return {
    q: params.get('q') ?? '',
    collection,
    categories: list('category') as CategorySlug[],
    sizes: list('size'),
    colors: list('color'),
    minPrice: num('min'),
    maxPrice: num('max'),
    inStock: params.get('stock') === '1',
    sort: sort && SORTS.includes(sort) ? sort : 'featured',
  };
}

export function paramsFromQuery(q: CatalogQuery): URLSearchParams {
  const p = new URLSearchParams();
  if (q.q) p.set('q', q.q);
  if (q.categories.length) p.set('category', q.categories.join(','));
  if (q.sizes.length) p.set('size', q.sizes.join(','));
  if (q.colors.length) p.set('color', q.colors.join(','));
  if (q.minPrice != null) p.set('min', String(q.minPrice));
  if (q.maxPrice != null) p.set('max', String(q.maxPrice));
  if (q.inStock) p.set('stock', '1');
  if (q.sort !== 'featured') p.set('sort', q.sort);
  return p;
}

export function searchSuggestions(q: string, limit = 5): Product[] {
  if (q.trim().length < 2) return [];
  return PRODUCTS.filter((p) => matchesSearch(p, q)).slice(0, limit);
}
