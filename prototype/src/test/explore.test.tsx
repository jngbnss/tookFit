import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MOODS } from '../data/moods';
import { PRODUCTS } from '../data/products';
import { STORAGE_KEYS } from '../lib/storage';
import { defaultVariant } from '../cinematic/defaultVariant';
import { renderApp } from './utils';

describe('explore', () => {
  it('filters by mood and category in list mode', async () => {
    const user = userEvent.setup();
    renderApp('/explore?view=list');
    expect(await screen.findByText(`상품 ${PRODUCTS.length}개`)).toBeInTheDocument();
    const moods = screen.getByRole('group', { name: '분위기' });
    await user.click(within(moods).getByRole('button', { name: 'VINTAGE' }));
    const vintage = MOODS.find((m) => m.id === 'vintage')!;
    expect(screen.getByText(`상품 ${vintage.productIds.length}개`)).toBeInTheDocument();
    const cats = screen.getByRole('group', { name: '카테고리' });
    await user.click(within(cats).getByRole('button', { name: '하의' }));
    const expected = PRODUCTS.filter((p) => p.category === 'bottoms' && vintage.productIds.includes(p.id)).length;
    expect(screen.getByText(`상품 ${expected}개`)).toBeInTheDocument();
  });

  it('adds a product from the canvas with its first in-stock option', async () => {
    const user = userEvent.setup();
    renderApp('/explore?view=canvas');
    const p = PRODUCTS[0];
    await user.click(await screen.findByRole('button', { name: `${p.name} 장바구니에 담기` }));
    const v = defaultVariant(p)!;
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.cart)!)).toEqual([expect.objectContaining({ productId: p.id, colorId: v.colorId, size: v.size, quantity: 1 })]);
  });

  it('switches the landing mood', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await screen.findByRole('heading', { level: 1, name: MOODS[0].tagline });
    await user.click(screen.getByRole('radio', { name: 'FUTURE' }));
    expect(await screen.findByRole('heading', { level: 1, name: MOODS.find((m) => m.id === 'future')!.tagline })).toBeInTheDocument();
  });
});
