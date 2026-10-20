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
    const dialog = await screen.findByRole('dialog', { name: /Free shipping over ₩100,000/ });
    await user.click(within(dialog).getByRole('button', { name: 'Offer 2 of 2' }));
    expect(within(dialog).getByRole('heading', { name: /TOOK10/ })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(isPromoHidden()).toBe(false);
  });

  it('stays hidden for the day when "Don’t show again today" is checked', async () => {
    const user = userEvent.setup();
    const first = renderApp('/');
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('checkbox', { name: /Don’t show again today/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(isPromoHidden()).toBe(true);
    first.unmount();
    renderApp('/');
    await screen.findByRole('heading', { level: 1, name: /Built for the cold/ });
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
    await user.click(screen.getByRole('button', { name: 'Dismiss announcement' }));
    expect(screen.queryByText(/Use code TOOK10 for 10% off/)).not.toBeInTheDocument();
  });
});
