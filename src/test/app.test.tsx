import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../lib/storage';
import { cartKey } from '../lib/pricing';
import { findVariant, product, renderApp } from './utils';

const ROUTES: [string, RegExp][] = [
  ['/', /덜어낼수록 선명해진다/],
  ['/explore', /탐색/],
  ['/shop/all', /전체 상품/],
  ['/shop/outerwear', /^아우터$/],
  ['/shop/sale', /^세일$/],
  ['/search?q=wool', /“wool”/],
  ['/product/ardent-wool-overcoat', /아던트 울 오버코트/],
  ['/wishlist', /^위시리스트$/],
  ['/cart', /^장바구니$/],
  ['/checkout', /주문\/결제/],
  ['/account/sign-in', /^로그인$/],
  ['/account/register', /회원가입/],
  ['/account/forgot-password', /비밀번호 찾기/],
  ['/account/orders', /주문 내역/],
  ['/about', /브랜드 소개/],
  ['/shipping-returns', /배송 및 반품/],
  ['/size-guide', /사이즈 가이드/],
  ['/contact', /고객센터/],
  ['/faq', /자주 묻는 질문/],
  ['/privacy', /개인정보처리방침/],
  ['/terms', /이용약관/],
  ['/does-not-exist', /페이지를 찾을 수 없습니다/],
  ['/product/not-a-product', /페이지를 찾을 수 없습니다/],
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
    expect(await screen.findByRole('heading', { name: /상품이 없습니다/ })).toBeInTheDocument();
    expect(screen.getByText('상품 0개')).toBeInTheDocument();
  });

  it('applies filters from the UI and reflects the count', async () => {
    const user = userEvent.setup();
    renderApp('/shop/shoes');
    await screen.findByRole('heading', { name: '무어 첼시 부츠' });
    expect(screen.getByText('상품 3개')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('정렬'), 'price-asc');
    const names = screen.getAllByRole('heading', { level: 3 }).filter((h) => h.closest('.card')).map((h) => h.textContent);
    expect(names.slice(0, 3)).toEqual(['프로스트 윈터 스니커즈', '클럭 레더 더비', '무어 첼시 부츠']);
    const aside = screen.getByRole('complementary', { name: '필터' });
    await user.click(within(aside).getByRole('radio', { name: '₩300,000 이상' }));
    expect(screen.getByText('상품 0개')).toBeInTheDocument();
  });
});

describe('product details', () => {
  it('requires color and size before adding to the bag', async () => {
    const user = userEvent.setup();
    renderApp('/product/harbor-cable-knit-sweater');
    await screen.findByRole('heading', { level: 1, name: '하버 케이블 니트' });
    await user.click(screen.getAllByRole('button', { name: '장바구니 담기' })[0]);
    expect(screen.getByText('색상을 선택해 주세요.')).toBeInTheDocument();
    expect(screen.getByText('사이즈를 선택해 주세요.')).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEYS.cart)).toBeNull();

    const p = product('tf-kn-01');
    const v = findVariant(p);
    await user.click(screen.getByRole('radio', { name: v.color.name }));
    expect(screen.getByText('사이즈를 선택해 주세요.')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: v.size }));
    await user.click(screen.getAllByRole('button', { name: '장바구니 담기' })[0]);
    const cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.cart)!);
    expect(cart).toEqual([{ key: cartKey(p.id, v.color.id, v.size), productId: p.id, colorId: v.color.id, size: v.size, quantity: 1 }]);
  });

  it('disables sold-out sizes and switches gallery images by color', async () => {
    const user = userEvent.setup();
    const p = product('tf-kn-01');
    const lastColor = p.colors[p.colors.length - 1];
    const lastSize = p.sizes[p.sizes.length - 1];
    renderApp(`/product/${p.slug}`);
    await screen.findByRole('heading', { level: 1, name: p.name });
    await user.click(screen.getByRole('radio', { name: lastColor.name }));
    expect(screen.getByRole('radio', { name: `${lastSize}, 품절` })).toBeDisabled();
    expect(screen.getByRole('button', { name: /이미지 확대/ }).querySelector('img')!.getAttribute('src')).toContain(`-${lastColor.id}-01.webp`);
  });
});

async function fillShipping(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('이름'), '박민');
  await user.type(screen.getByLabelText('이메일'), 'min@example.com');
  await user.type(screen.getByLabelText('휴대폰 번호'), '010-1234-5678');
  await user.type(screen.getByLabelText('우편번호'), '04524');
  await user.type(screen.getByLabelText('시/도'), '서울');
  await user.type(screen.getByLabelText('주소'), '중구 샘플로 12');
  await user.click(screen.getByRole('checkbox', { name: /데모 스토어임을 이해했으며/ }));
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
    await screen.findByText('데모 결제입니다. 실제 결제는 진행되지 않습니다. 샘플 정보만 입력하세요.');
    await user.click(screen.getByRole('button', { name: /결제하기$/ }));
    expect(screen.getByRole('alert')).toHaveTextContent('아래 11개 항목을 확인해 주세요.');
    expect(screen.getByLabelText('이름')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('우편번호는 5자리 숫자입니다.')).toBeInTheDocument();
    expect(screen.getByText('CVC는 3~4자리 숫자입니다.')).toBeInTheDocument();
  });

  it('handles a declined card, then succeeds on retry, creating an order and clearing the bag', async () => {
    seedCart();
    const user = userEvent.setup();
    renderApp('/checkout');
    await screen.findByRole('heading', { level: 1, name: '주문/결제' });
    await fillShipping(user);
    await user.type(screen.getByLabelText('카드 번호'), '4000000000000002');
    await user.type(screen.getByLabelText('유효기간 (MM/YY)'), '1230');
    await user.type(screen.getByLabelText('CVC'), '123');
    await user.type(screen.getByLabelText('카드 소유자 이름'), '박민');
    await user.click(screen.getByRole('button', { name: /결제하기$/ }));
    expect(await screen.findByText(/결제가 거절되었습니다/, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEYS.orders)).toBeNull();

    const cardInput = screen.getByLabelText('카드 번호');
    await user.clear(cardInput);
    await user.type(cardInput, '4242424242424242');
    await user.click(screen.getByRole('button', { name: /다시 결제하기/ }));
    expect(await screen.findByRole('heading', { name: /주문이 완료되었습니다/ }, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByText(/끝자리 4242/)).toBeInTheDocument();

    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.orders)!);
    expect(orders).toHaveLength(1);
    expect(orders[0].id).toMatch(/^TF-\d{8}-\d{6}$/);
    expect(orders[0].payment).toEqual({ method: 'card', label: '신용·체크카드', last4: '4242' });
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
    await screen.findByRole('heading', { level: 1, name: '주문/결제' });
    await fillShipping(user);
    await user.click(screen.getByRole('radio', { name: /카카오페이/ }));
    await user.click(screen.getByRole('button', { name: /결제하기$/ }));
    const dialog = await screen.findByRole('dialog', { name: /카카오페이 \(시뮬레이션\)/ });
    await user.click(within(dialog).getByRole('button', { name: '결제 승인' }));
    expect(await screen.findByRole('heading', { name: /주문이 완료되었습니다/ }, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getAllByText('카카오페이').length).toBeGreaterThan(0);
  });
});
