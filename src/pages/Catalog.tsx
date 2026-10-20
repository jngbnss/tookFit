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
  { label: '₩100,000 미만', min: null, max: 99999 },
  { label: '₩100,000 – ₩200,000', min: 100000, max: 200000 },
  { label: '₩200,000 – ₩300,000', min: 200000, max: 300000 },
  { label: '₩300,000 이상', min: 300000, max: null },
];

const SIZE_GROUPS: { label: string; sizes: string[] }[] = [
  { label: '의류', sizes: ['S', 'M', 'L', 'XL'] },
  { label: '허리', sizes: ['28', '30', '32', '34', '36'] },
  { label: '신발 (mm)', sizes: ['250', '260', '270', '280', '290'] },
];

const VALID: CollectionSlug[] = ['all', 'new-arrivals', 'best-sellers', 'sale', ...CATEGORIES.map((c) => c.slug)];

const DESCRIPTIONS: Partial<Record<CollectionSlug, string>> = {
  all: '아우터부터 니트, 이너까지 F/W 컬렉션 전체.',
  'new-arrivals': '이번 시즌 새로 입고된 상품.',
  'best-sellers': '고객들이 다시 찾는 인기 상품.',
  sale: '사이즈 소진 시까지 진행되는 할인 상품.',
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
            <legend>카테고리</legend>
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
        <h3 id="f-size">사이즈</h3>
        {SIZE_GROUPS.map((g) => (
          <div key={g.label} style={{ marginBottom: 10 }}>
            <p className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
              {g.label}
            </p>
            <div className="size-grid" role="group" aria-label={`${g.label} 사이즈`}>
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
        <h3>색상</h3>
        <div className="color-list" role="group" aria-label="색상">
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
          <legend>가격</legend>
          <div className="stack" style={{ gap: 6 }}>
            <label className="checkbox">
              <input type="radio" name="price" checked={query.minPrice == null && query.maxPrice == null} onChange={() => update({ minPrice: null, maxPrice: null })} />
              전체
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
          재고 있는 상품만
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

  const label = search ? '검색' : collection === 'all' ? '전체 상품' : COLLECTIONS.find((c) => c.slug === collection)?.label ?? '';
  const category = CATEGORIES.find((c) => c.slug === collection);
  const description = search ? (query.q ? `“${query.q}” 검색 결과입니다.` : '컬렉션을 검색해 보세요.') : category?.blurb ?? DESCRIPTIONS[collection] ?? '';
  usePageMeta(search && query.q ? `검색: ${query.q}` : label, description);

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
      <nav className="breadcrumbs" aria-label="현재 위치">
        <ol>
          <li>
            <Link to="/">홈</Link>
          </li>
          <li aria-current="page">{label}</li>
        </ol>
      </nav>
      <header className="catalog-head">
        <h1 className="page-title">{search && query.q ? `“${query.q}”` : label}</h1>
        <p className="muted">{description}</p>
        {!search && (
          <nav aria-label="컬렉션">
            <ul className="chip-row">
              {[{ slug: 'all', label: '전체' }, ...COLLECTIONS].map((c) => (
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
            <FilterIcon /> 필터{activeCount ? ` (${activeCount})` : ''}
          </button>
          <p aria-live="polite" style={{ fontSize: 13 }}>
            상품 {results.length}개
          </p>
          {activeCount > 0 && (
            <button type="button" className="btn-text" onClick={reset}>
              필터 초기화
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label htmlFor="sort" style={{ fontSize: 13 }}>
            정렬
          </label>
          <select id="sort" className="select" value={query.sort} onChange={(e) => update({ sort: e.target.value as SortKey })}>
            <option value="featured">추천순</option>
            <option value="newest">신상품순</option>
            <option value="price-asc">낮은 가격순</option>
            <option value="price-desc">높은 가격순</option>
          </select>
        </div>
      </div>

      <div className="catalog-layout">
        <aside className="filters-desktop" aria-label="필터">
          <Filters query={query} update={update} showCategories={collection === 'all' || ['new-arrivals', 'best-sellers', 'sale'].includes(collection)} />
        </aside>
        <div>
          {loading ? (
            <SkeletonGrid count={8} />
          ) : results.length === 0 ? (
            <div className="empty">
              <h2>상품이 없습니다</h2>
              <p className="muted">
                {query.q ? `“${query.q}”와(과) 일치하는 상품이 없습니다` : '조건에 맞는 상품이 없습니다'}
                {activeCount ? ' (현재 필터 기준).' : '.'} 검색어를 넓히거나 필터를 초기화해 보세요.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {activeCount > 0 && (
                  <button type="button" className="btn btn-primary" onClick={reset}>
                    필터 초기화
                  </button>
                )}
                <Link to="/shop/all" className="btn btn-secondary">
                  전체 상품 보기
                </Link>
              </div>
            </div>
          ) : (
            <>
              <ProductGrid products={shown} eagerCount={4} />
              <div className="load-more">
                <p style={{ fontSize: 13 }}>
                  {results.length}개 중 {shown.length}개 표시
                </p>
                <div className="progress" aria-hidden="true">
                  <span style={{ width: `${(shown.length / results.length) * 100}%` }} />
                </div>
                {shown.length < results.length && (
                  <button type="button" className="btn btn-secondary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                    더 보기
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
        title="필터"
        side="left"
        footer={
          <>
            <button type="button" className="btn btn-primary btn-block" onClick={() => setFiltersOpen(false)}>
              상품 {results.length}개 보기
            </button>
            <button type="button" className="btn btn-secondary btn-block" onClick={reset} disabled={!activeCount}>
              필터 초기화
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
