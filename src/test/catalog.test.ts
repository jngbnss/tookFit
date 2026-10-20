import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRODUCTS } from '../data/products';
import { DEFAULT_QUERY, filterProducts, paramsFromQuery, queryFromParams, searchSuggestions } from '../lib/catalog';

describe('catalog data', () => {
  it('has at least 32 unique products with the required distribution', () => {
    expect(PRODUCTS.length).toBeGreaterThanOrEqual(32);
    expect(new Set(PRODUCTS.map((p) => p.id)).size).toBe(PRODUCTS.length);
    expect(new Set(PRODUCTS.map((p) => p.slug)).size).toBe(PRODUCTS.length);
    expect(new Set(PRODUCTS.map((p) => p.name)).size).toBe(PRODUCTS.length);
    const count = (c: string) => PRODUCTS.filter((p) => p.category === c).length;
    expect([count('outerwear'), count('knitwear'), count('tops'), count('bottoms'), count('sets'), count('shoes'), count('bags'), count('accessories')]).toEqual([
      6, 5, 5, 6, 3, 3, 2, 2,
    ]);
  });

  it('gives every product complete data and existing local images', () => {
    for (const p of PRODUCTS) {
      expect(p.colors.length).toBeGreaterThanOrEqual(2);
      expect(p.colors.length).toBeLessThanOrEqual(4);
      expect(p.sizes.length).toBeGreaterThanOrEqual(2);
      expect(p.images.length).toBeGreaterThanOrEqual(2);
      expect(p.relatedIds.every((id) => PRODUCTS.some((x) => x.id === id))).toBe(true);
      for (const img of p.images) {
        expect(img.alt.length).toBeGreaterThan(10);
        expect(existsSync(resolve(process.cwd(), 'public', img.src))).toBe(true);
      }
    }
  });
});

describe('filtering and sorting', () => {
  it('combines search, category, size, color, price, and stock filters', () => {
    const result = filterProducts(PRODUCTS, {
      ...DEFAULT_QUERY,
      q: 'wool',
      categories: ['outerwear', 'bottoms'],
      sizes: ['M', '32'],
      colors: ['charcoal'],
      maxPrice: 200000,
      inStock: true,
    });
    expect(result.map((p) => p.slug)).toEqual(['avenue-wide-wool-trousers']);
  });

  it('searches name, category, and description', () => {
    expect(filterProducts(PRODUCTS, { ...DEFAULT_QUERY, q: 'chelsea' }).map((p) => p.slug)).toEqual(['moor-chelsea-boots']);
    expect(filterProducts(PRODUCTS, { ...DEFAULT_QUERY, q: 'accessories' }).length).toBe(2);
    expect(filterProducts(PRODUCTS, { ...DEFAULT_QUERY, q: 'goodyear' }).map((p) => p.slug)).toEqual(['clerk-leather-derby']);
    expect(searchSuggestions('cab').map((p) => p.slug)).toContain('harbor-cable-knit-sweater');
  });

  it('sorts by price and newest', () => {
    const asc = filterProducts(PRODUCTS, { ...DEFAULT_QUERY, sort: 'price-asc' });
    expect(asc.map((p) => p.price)).toEqual([...asc.map((p) => p.price)].sort((a, b) => a - b));
    const desc = filterProducts(PRODUCTS, { ...DEFAULT_QUERY, sort: 'price-desc' });
    expect(desc[0].price).toBe(Math.max(...PRODUCTS.map((p) => p.price)));
    const newest = filterProducts(PRODUCTS, { ...DEFAULT_QUERY, sort: 'newest' });
    expect(newest[0].createdAt >= newest[newest.length - 1].createdAt).toBe(true);
  });

  it('returns no results for an unmatched search', () => {
    expect(filterProducts(PRODUCTS, { ...DEFAULT_QUERY, q: 'hawaiian shirt' })).toEqual([]);
  });

  it('collections filter correctly', () => {
    expect(filterProducts(PRODUCTS, { ...DEFAULT_QUERY, collection: 'sale' }).every((p) => p.originalPrice! > p.price)).toBe(true);
    expect(filterProducts(PRODUCTS, { ...DEFAULT_QUERY, collection: 'best-sellers' }).every((p) => p.badge === 'BEST')).toBe(true);
  });

  it('round-trips filters through URL params', () => {
    const q = { ...DEFAULT_QUERY, q: 'knit', sizes: ['M'], colors: ['cream'], minPrice: 100000, maxPrice: 200000, inStock: true, sort: 'price-desc' as const };
    expect(queryFromParams(paramsFromQuery(q), 'all')).toEqual(q);
  });
});
