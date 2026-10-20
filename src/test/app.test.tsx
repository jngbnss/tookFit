import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../lib/storage';
import { cartKey } from '../lib/pricing';
import { findVariant, product, renderApp } from './utils';

const ROUTES: [string, RegExp][] = [
  ['/', /Built for the cold/i],
  ['/shop/all', /All Products/i],
  ['/shop/outerwear', /^Outerwear$/i],
  ['/shop/sale', /^Sale$/i],
  ['/search?q=wool', /“wool”/],
  ['/product/ardent-wool-overcoat', /Ardent Wool Overcoat/],
  ['/wishlist', /^Wishlist$/],
  ['/cart', /Your bag/],
  ['/checkout', /Checkout/],
  ['/account/sign-in', /Sign in/],
  ['/account/register', /Create account/],
  ['/account/forgot-password', /Reset password/],
  ['/account/orders', /Order history/],
  ['/about', /About/],
  ['/shipping-returns', /Shipping & Returns/],
  ['/size-guide', /Size Guide/],
  ['/contact', /Contact/],
  ['/faq', /FAQ/],
  ['/privacy', /Privacy/],
  ['/terms', /Terms/],
  ['/does-not-exist', /couldn’t find that page/],
  ['/product/not-a-product', /couldn’t find that page/],
];

describe('routes', () => {
  it.each(ROUTES)('renders %s', async (path, heading) => {
    renderApp(path);
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });
});

describe('catalog UI', () => {
  it('shows a no-results state for an unmatched search', async () => {
    renderApp('/search?q=hawaiian');
    expect(await screen.findByRole('heading', { name: /No products found/i })).toBeInTheDocument();
    expect(screen.getByText(/0 products/)).toBeInTheDocument();
  });

  it('applies filters from the UI and reflects the count', async () => {
    const user = userEvent.setup();
    renderApp('/shop/shoes');
    await screen.findByRole('heading', { name: 'Moor Chelsea Boots' });
    expect(screen.getByText('3 products')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Sort by'), 'price-asc');
    const names = screen.getAllByRole('heading', { level: 3 }).filter((h) => h.closest('.card')).map((h) => h.textContent);
    expect(names.slice(0, 3)).toEqual(['Frost Winter Sneaker', 'Clerk Leather Derby', 'Moor Chelsea Boots']);
    const aside = screen.getByRole('complementary', { name: 'Filters' });
    await user.click(within(aside).getByRole('radio', { name: 'Over ₩300,000' }));
    expect(screen.getByText(/0 products/)).toBeInTheDocument();
  });
});

describe('product details', () => {
  it('requires color and size before adding to the bag', async () => {
    const user = userEvent.setup();
    renderApp('/product/harbor-cable-knit-sweater');
    await screen.findByRole('heading', { level: 1, name: 'Harbor Cable-Knit Sweater' });
    await user.click(screen.getAllByRole('button', { name: 'Add to bag' })[0]);
    expect(screen.getByText('Please select a color.')).toBeInTheDocument();
    expect(screen.getByText('Please select a size.')).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEYS.cart)).toBeNull();

    const p = product('tf-kn-01');
    const v = findVariant(p);
    await user.click(screen.getByRole('radio', { name: v.color.name }));
    expect(screen.getByText('Please select a size.')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: v.size }));
    await user.click(screen.getAllByRole('button', { name: 'Add to bag' })[0]);
    const cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.cart)!);
    expect(cart).toEqual([{ key: cartKey(p.id, v.color.id, v.size), productId: p.id, colorId: v.color.id, size: v.size, quantity: 1 }]);
  });

  it('disables sold-out sizes for the selected color', async () => {
    const user = userEvent.setup();
    const p = product('tf-kn-01');
    const lastColor = p.colors[p.colors.length - 1];
    const lastSize = p.sizes[p.sizes.length - 1];
    renderApp(`/product/${p.slug}`);
    await screen.findByRole('heading', { level: 1, name: p.name });
    await user.click(screen.getByRole('radio', { name: lastColor.name }));
    expect(screen.getByRole('radio', { name: `${lastSize}, sold out` })).toBeDisabled();
  });
});

async function fillShipping(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Full name'), 'Min Park');
  await user.type(screen.getByLabelText('Email'), 'min@example.com');
  await user.type(screen.getByLabelText('Phone'), '010-1234-5678');
  await user.type(screen.getByLabelText('Postal code'), '04524');
  await user.type(screen.getByLabelText('City'), 'Seoul');
  await user.type(screen.getByLabelText('Address'), '12 Sample-ro, Jung-gu');
  await user.click(screen.getByRole('checkbox', { name: /I understand this is a demo store/ }));
}

function seedCart() {
  const p = product('tf-ow-01');
  const v = findVariant(p);
  localStorage.setItem(
    STORAGE_KEYS.cart,
    JSON.stringify([{ key: cartKey(p.id, v.color.id, v.size), productId: p.id, colorId: v.color.id, size: v.size, quantity: 1 }]),
  );
}

describe('checkout', () => {
  it('shows field errors when submitting an empty form', async () => {
    seedCart();
    const user = userEvent.setup();
    renderApp('/checkout');
    await screen.findByText(/Demo checkout. No real payment will be processed. Use sample information only./);
    await user.click(screen.getByRole('button', { name: /^Pay/ }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Please fix 11 fields/);
    expect(screen.getByLabelText('Full name')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Postal code must be 5 digits.')).toBeInTheDocument();
    expect(screen.getByText('CVC must be 3 or 4 digits.')).toBeInTheDocument();
  });

  it('handles a declined card, then succeeds on retry, creating an order and clearing the bag', async () => {
    seedCart();
    const user = userEvent.setup();
    renderApp('/checkout');
    await screen.findByRole('heading', { level: 1, name: 'Checkout' });
    await fillShipping(user);
    await user.type(screen.getByLabelText('Card number'), '4000000000000002');
    await user.type(screen.getByLabelText('Expiry (MM/YY)'), '1230');
    await user.type(screen.getByLabelText('CVC'), '123');
    await user.type(screen.getByLabelText('Name on card'), 'Min Park');
    await user.click(screen.getByRole('button', { name: /^Pay/ }));
    expect(await screen.findByText(/Payment declined/, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEYS.orders)).toBeNull();

    const cardInput = screen.getByLabelText('Card number');
    await user.clear(cardInput);
    await user.type(cardInput, '4242424242424242');
    await user.click(screen.getByRole('button', { name: /Retry payment/ }));
    expect(await screen.findByRole('heading', { name: /Your order is confirmed/ }, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByText(/ending in 4242/)).toBeInTheDocument();

    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.orders)!);
    expect(orders).toHaveLength(1);
    expect(orders[0].id).toMatch(/^TF-\d{8}-\d{6}$/);
    expect(orders[0].payment).toEqual({ method: 'card', label: 'Credit / debit card', last4: '4242' });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.cart)!)).toEqual([]);

    // Sensitive card data must never be persisted anywhere.
    const everything = Object.keys(localStorage).map((k) => localStorage.getItem(k)).join('\n');
    expect(everything).not.toMatch(/4242\s?4242\s?4242\s?4242/);
    expect(everything).not.toMatch(/4000\s?0000\s?0000\s?0002/);
    expect(everything).not.toContain('12/30');
    expect(everything).not.toMatch(/"cvc"|"expiry"|"cardNumber"/);
  });

  it('completes a simulated Kakao Pay payment', async () => {
    seedCart();
    const user = userEvent.setup();
    renderApp('/checkout');
    await screen.findByRole('heading', { level: 1, name: 'Checkout' });
    await fillShipping(user);
    await user.click(screen.getByRole('radio', { name: /Kakao Pay/ }));
    await user.click(screen.getByRole('button', { name: /^Pay/ }));
    const dialog = await screen.findByRole('dialog', { name: /Kakao Pay \(simulated\)/ });
    await user.click(within(dialog).getByRole('button', { name: 'Approve payment' }));
    expect(await screen.findByRole('heading', { name: /Your order is confirmed/ }, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getAllByText('Kakao Pay').length).toBeGreaterThan(0);
  });
});
