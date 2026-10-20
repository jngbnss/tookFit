import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ALL_COLORS, CATEGORIES, COLLECTIONS, PRODUCTS } from '../data/products';
import type { CatalogQuery, CategorySlug, CollectionSlug, SortKey } from '../domain/types';
import { DEFAULT_QUERY, filterProducts, paramsFromQuery, queryFromParams } from '../lib/catalog';
import { track } from '../lib/analytics';
import { ProductGrid, SkeletonGrid } from '../components/ProductCard';
import { Drawer } from '../components/Overlay';
import { FilterIcon } from '../components/Icons';
import { RecentlyViewed } from '../components/RecentlyViewed';
import { usePageMeta } from '../components/usePageMeta';
import NotFound from './NotFound';

const PAGE_SIZE = 12;

const PRICE_RANGES: { label: string; min: number | null; max: number | null }[] = [
  { label: 'Under ₩100,000', min: null, max: 99999 },
  { label: '₩100,000 – ₩200,000', min: 100000, max: 200000 },
  { label: '₩200,000 – ₩300,000', min: 200000, max: 300000 },
  { label: 'Over ₩300,000', min: 300000, max: null },
];

const SIZE_GROUPS: { label: string; sizes: string[] }[] = [
  { label: 'Clothing', sizes: ['S', 'M', 'L', 'XL'] },
  { label: 'Waist', sizes: ['28', '30', '32', '34', '36'] },
  { label: 'Shoes (mm)', sizes: ['250', '260', '270', '280', '290'] },
];

const VALID: CollectionSlug[] = ['all', 'new-arrivals', 'best-sellers', 'sale', ...CATEGORIES.map((c) => c.slug)];

const DESCRIPTIONS: Partial<Record<CollectionSlug, string>> = {
  all: 'The complete fall/winter collection — outerwear, knitwear, and everything to wear underneath.',
  'new-arrivals': 'The latest pieces to land this season.',
  'best-sellers': 'The pieces our customers come back for.',
  sale: 'Selected pieces at reduced prices, while sizes last.',
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function Filters({ query, update, showCategories }: { query: CatalogQuery; update: (patch: Partial<CatalogQuery>) => void; showCategories: boolean }) {
  return (
    <div>
      {showCategories && (
        <div className="filter-group">
          <fieldset>
            <legend>Category</legend>
            <div className="stack" style={{ gap: 6 }}>
              {CATEGORIES.map((c) => (
                <label key={c.slug} className="checkbox">
                  <input type="checkbox" checked={query.categories.includes(c.slug)} onChange={() => update({ categories: toggle<CategorySlug>(query.categories, c.slug) })} />
                  {c.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      )}
      <div className="filter-group">
        <h3 id="f-size">Size</h3>
        {SIZE_GROUPS.map((g) => (
          <div key={g.label} style={{ marginBottom: 10 }}>
            <p className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
              {g.label}
            </p>
            <div className="size-grid" role="group" aria-label={`${g.label} sizes`}>
              {g.sizes.map((s) => (
                <button key={s} type="button" className="size-toggle" aria-pressed={query.sizes.includes(s)} onClick={() => update({ sizes: toggle(query.sizes, s) })}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="filter-group">
        <h3>Color</h3>
        <div className="stack" style={{ gap: 2 }} role="group" aria-label="Colors">
          {ALL_COLORS.map((c) => (
            <button key={c.id} type="button" className="color-toggle" aria-pressed={query.colors.includes(c.id)} onClick={() => update({ colors: toggle(query.colors, c.id) })}>
              <span className="swatch-dot" style={{ background: c.hex }} aria-hidden="true" />
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-group">
        <fieldset>
          <legend>Price</legend>
          <div className="stack" style={{ gap: 6 }}>
            <label className="checkbox">
              <input type="radio" name="price" checked={query.minPrice == null && query.maxPrice == null} onChange={() => update({ minPrice: null, maxPrice: null })} />
              Any price
            </label>
            {PRICE_RANGES.map((r) => (
              <label key={r.label} className="checkbox">
                <input type="radio" name="price" checked={query.minPrice === r.min && query.maxPrice === r.max} onChange={() => update({ minPrice: r.min, maxPrice: r.max })} />
                {r.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="filter-group">
        <label className="checkbox">
          <input type="checkbox" checked={query.inStock} onChange={() => update({ inStock: !query.inStock })} />
          In stock only
        </label>
      </div>
    </div>
  );
}

export default function Catalog({ search = false }: { search?: boolean }) {
  const { collection: param = 'all' } = useParams();
  const [params, setParams] = useSearchParams();
  const collection = (search ? 'all' : param) as CollectionSlug;
  const query = useMemo(() => queryFromParams(params, collection), [params, collection]);
  const results = useMemo(() => filterProducts(PRODUCTS, query), [query]);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const label = search ? 'Search' : collection === 'all' ? 'All Products' : COLLECTIONS.find((c) => c.slug === collection)?.label ?? '';
  const category = CATEGORIES.find((c) => c.slug === collection);
  const description = search ? (query.q ? `Results for “${query.q}”.` : 'Search the collection.') : category?.blurb ?? DESCRIPTIONS[collection] ?? '';
  usePageMeta(search && query.q ? `Search: ${query.q}` : label, description);

  useEffect(() => {
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 220);
    return () => window.clearTimeout(t);
  }, [collection]);

  useEffect(() => setVisible(PAGE_SIZE), [params, collection]);

  if (!VALID.includes(collection)) return <NotFound />;

  function update(patch: Partial<CatalogQuery>) {
    const next = { ...query, ...patch };
    setParams(paramsFromQuery(next), { replace: true });
    const changed = Object.keys(patch).join(',');
    if (changed !== 'sort') track('filter_applied', { filters: changed });
  }

  function reset() {
    setParams(paramsFromQuery({ ...DEFAULT_QUERY, q: query.q, sort: query.sort }), { replace: true });
  }

  const activeCount = query.categories.length + query.sizes.length + query.colors.length + (query.minPrice != null || query.maxPrice != null ? 1 : 0) + (query.inStock ? 1 : 0);
  const shown = results.slice(0, visible);

  return (
    <>
    <div className="container">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li aria-current="page">{label}</li>
        </ol>
      </nav>
      <header className="catalog-head">
        <h1 className="page-title">{search && query.q ? `“${query.q}”` : label}</h1>
        <p className="muted">{description}</p>
        {!search && (
          <nav aria-label="Collections">
            <ul className="chip-row">
              {[{ slug: 'all', label: 'All' }, ...COLLECTIONS].map((c) => (
                <li key={c.slug}>
                  <Link className="chip" to={`/shop/${c.slug}`} aria-current={c.slug === collection ? 'page' : undefined}>
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      <div className="toolbar">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary filters-mobile-btn" style={{ minHeight: 40 }} onClick={() => setFiltersOpen(true)} aria-haspopup="dialog">
            <FilterIcon /> Filters{activeCount ? ` (${activeCount})` : ''}
          </button>
          <p aria-live="polite" style={{ fontSize: 13 }}>
            {results.length} {results.length === 1 ? 'product' : 'products'}
          </p>
          {activeCount > 0 && (
            <button type="button" className="btn-text" onClick={reset}>
              Reset filters
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label htmlFor="sort" style={{ fontSize: 13 }}>
            Sort by
          </label>
          <select id="sort" className="select" value={query.sort} onChange={(e) => update({ sort: e.target.value as SortKey })}>
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="catalog-layout">
        <aside className="filters-desktop" aria-label="Filters">
          <Filters query={query} update={update} showCategories={collection === 'all' || ['new-arrivals', 'best-sellers', 'sale'].includes(collection)} />
        </aside>
        <div>
          {loading ? (
            <SkeletonGrid count={8} />
          ) : results.length === 0 ? (
            <div className="empty">
              <h2>No products found</h2>
              <p className="muted">
                {query.q ? `Nothing matched “${query.q}”` : 'Nothing matches these filters'}
                {activeCount ? ' with the current filters.' : '.'} Try a broader search or reset your filters.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {activeCount > 0 && (
                  <button type="button" className="btn btn-primary" onClick={reset}>
                    Reset filters
                  </button>
                )}
                <Link to="/shop/all" className="btn btn-secondary">
                  View all products
                </Link>
              </div>
            </div>
          ) : (
            <>
              <ProductGrid products={shown} eagerCount={4} />
              <div className="load-more">
                <p style={{ fontSize: 13 }}>
                  Showing {shown.length} of {results.length}
                </p>
                <div className="progress" aria-hidden="true">
                  <span style={{ width: `${(shown.length / results.length) * 100}%` }} />
                </div>
                {shown.length < results.length && (
                  <button type="button" className="btn btn-secondary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                    Load more
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        side="left"
        footer={
          <>
            <button type="button" className="btn btn-primary btn-block" onClick={() => setFiltersOpen(false)}>
              Show {results.length} {results.length === 1 ? 'product' : 'products'}
            </button>
            <button type="button" className="btn btn-secondary btn-block" onClick={reset} disabled={!activeCount}>
              Reset filters
            </button>
          </>
        }
      >
        <Filters query={query} update={update} showCategories={collection === 'all' || ['new-arrivals', 'best-sellers', 'sale'].includes(collection)} />
      </Drawer>
    </div>
    <RecentlyViewed />
    </>
  );
}
