import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { PRODUCTS } from '../data/products';
import type { Product } from '../domain/types';

export function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

/** First variant with at least `min` units in stock. */
export function findVariant(product: Product, min = 1) {
  for (const c of product.colors) {
    for (const s of product.sizes) {
      if ((product.stock[c.id]?.[s] ?? 0) >= min) return { color: c, size: s, stock: product.stock[c.id][s] };
    }
  }
  throw new Error(`No variant with ${min} units for ${product.id}`);
}

export function findSoldOut(product: Product) {
  for (const c of product.colors) {
    for (const s of product.sizes) {
      if ((product.stock[c.id]?.[s] ?? 0) === 0) return { color: c, size: s };
    }
  }
  throw new Error('no sold-out variant');
}

export const product = (id: string) => PRODUCTS.find((p) => p.id === id)!;
