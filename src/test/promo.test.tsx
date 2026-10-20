import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { isPromoHidden } from '../components/PromoPopup';
import { STORAGE_KEYS } from '../lib/storage';
import { renderApp } from './utils';

describe('promo popup and announcement', () => {
  beforeEach(() => localStorage.removeItem(STORAGE_KEYS.promoHiddenOn));

  it('shows on first visit and closes without remembering by default', async () => {
    const user = userEvent.setup();
    renderApp('/');
    const dialog = await screen.findByRole('dialog', { name: /₩100,000 이상 무료배송/ });
    await user.click(within(dialog).getByRole('button', { name: '혜택 2 / 2' }));
    expect(within(dialog).getByRole('heading', { name: /TUK10/ })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: '닫기' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(isPromoHidden()).toBe(false);
  });

  it('stays hidden for the day when "오늘 하루 보지 않기" is checked', async () => {
    const user = userEvent.setup();
    const first = renderApp('/');
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('checkbox', { name: /오늘 하루 보지 않기/ }));
    await user.click(within(dialog).getByRole('button', { name: '닫기' }));
    expect(isPromoHidden()).toBe(true);
    first.unmount();
    renderApp('/');
    await screen.findByRole('heading', { level: 1, name: /적게, 그러나 정확하게/ });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isPromoHidden(tomorrow)).toBe(false);
  });

  it('closes with Escape and dismisses the announcement bar', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '공지 닫기' }));
    expect(screen.queryByRole('button', { name: '공지 닫기' })).not.toBeInTheDocument();
  });
});
