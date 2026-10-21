// 프로토타입 상품 데이터로 개발용 시드 SQL을 만든다.
// 실행 (저장소 루트에서): node backend/scripts/generate-dev-seed.mjs
// 결과: backend/src/main/resources/db/seed/dev-seed.sql
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { PRODUCTS, CATEGORIES } = await import(
  pathToFileURL(join(root, 'prototype', 'src', 'data', 'products.ts')).href
);
const imageDir = join(root, 'prototype', 'public', 'images', 'products');

const q = (v) => (v === null || v === undefined ? 'NULL' : `'${String(v).replaceAll("'", "''")}'`);
const out = [];
const emit = (s) => out.push(s);

emit('-- 자동 생성 파일: backend/scripts/generate-dev-seed.mjs. 직접 수정하지 마세요.');
emit('-- {{ADMIN_HASH}}, {{USER_HASH}}는 DevDataSeeder가 BCrypt 해시로 바꾼다.');
emit('');

CATEGORIES.forEach((c, i) => {
  emit(`INSERT INTO categories (slug, name, sort_order, visible, created_at, updated_at) VALUES (${q(c.slug)}, ${q(c.label)}, ${i}, TRUE, now(), now());`);
});
emit('');

PRODUCTS.forEach((p, pi) => {
  const pid = `(SELECT id FROM products WHERE slug = ${q(p.slug)})`;
  const status = 'ACTIVE';
  emit(`INSERT INTO products (slug, category_id, name, description, price, original_price, badge, material, fit, care, status, featured_rank, published_at, created_at, updated_at) VALUES (` +
    `${q(p.slug)}, (SELECT id FROM categories WHERE slug = ${q(p.category)}), ${q(p.name)}, ${q(p.description)}, ${p.price}, ${p.originalPrice ?? 'NULL'}, ${q(p.badge ?? null)}, ` +
    `${q(p.material)}, ${q(p.fit)}, ${q(p.care.join('\n'))}, '${status}', ${p.featuredRank + 1}, '${p.createdAt}T10:00:00+09:00', now(), now());`);
  p.colors.forEach((c, ci) => {
    emit(`INSERT INTO product_colors (product_id, name, hex, sort_order, created_at, updated_at) VALUES (${pid}, ${q(c.name)}, ${q(c.hex)}, ${ci}, now(), now());`);
    const cid = `(SELECT id FROM product_colors WHERE product_id = ${pid} AND name = ${q(c.name)})`;
    p.sizes.forEach((size) => {
      const sku = `TF${String(pi + 1).padStart(3, '0')}-${c.id}-${size}`.toUpperCase();
      emit(`INSERT INTO product_variants (product_id, color_id, size, sku, stock, active, created_at, updated_at) VALUES (${pid}, ${cid}, ${q(size)}, ${q(sku)}, ${p.stock[c.id][size]}, TRUE, now(), now());`);
    });
  });
  let order = 0;
  p.images.forEach((img) => {
    const file = img.src.split('/').pop();
    if (!existsSync(join(imageDir, file))) return;
    const color = p.colors.find((c) => c.id === img.colorId);
    const cid = color ? `(SELECT id FROM product_colors WHERE product_id = ${pid} AND name = ${q(color.name)})` : 'NULL';
    emit(`INSERT INTO product_images (product_id, color_id, storage_key, alt, sort_order, created_at, updated_at) VALUES (${pid}, ${cid}, ${q('products/' + file)}, ${q(img.alt)}, ${order++}, now(), now());`);
  });
  emit('');
});

emit(`INSERT INTO coupons (code, name, discount_type, discount_value, max_discount, min_order_amount, per_user_limit, used_count, active, created_at, updated_at) VALUES ('TUK10', '첫 구매 10% 할인', 'PERCENT', 10, 20000, 0, 1, 0, TRUE, now(), now());`);
emit(`INSERT INTO coupons (code, name, discount_type, discount_value, max_discount, min_order_amount, per_user_limit, used_count, active, created_at, updated_at) VALUES ('WELCOME5000', '가입 축하 5,000원', 'FIXED', 5000, NULL, 50000, 1, 0, TRUE, now(), now());`);
emit('');

emit(`INSERT INTO banners (position, title, subtitle, image_key, mobile_image_key, link_url, sort_order, active, created_at, updated_at) VALUES ('MAIN_HERO', '가을, 단단하게', '2026 F/W 컬렉션', 'banners/hero-01.webp', 'banners/hero-mobile-01.webp', '/shop/new-arrivals', 0, TRUE, now(), now());`);
emit(`INSERT INTO banners (position, title, subtitle, image_key, link_url, sort_order, active, created_at, updated_at) VALUES ('MAIN_MIDDLE', '니트의 계절', '좋은 원사로 촘촘히 짠 니트', 'banners/editorial-02.webp', '/shop/knitwear', 0, TRUE, now(), now());`);
emit(`INSERT INTO banners (position, title, subtitle, image_key, link_url, sort_order, active, created_at, updated_at) VALUES ('MAIN_MIDDLE', '아우터 컬렉션', '계절을 건너는 코트와 재킷', 'banners/editorial-03.webp', '/shop/outerwear', 1, TRUE, now(), now());`);
emit(`INSERT INTO banners (position, title, link_url, sort_order, active, created_at, updated_at) VALUES ('TOP_STRIP', '5만 원 이상 무료배송 · 첫 구매 10% 할인 TUK10', '/shop/all', 0, TRUE, now(), now());`);
emit('');

emit(`INSERT INTO notices (title, body, pinned, published, created_at, updated_at) VALUES ('TUK FIT 오픈 안내', 'TUK FIT 온라인 스토어가 문을 열었습니다. 첫 구매 고객께는 TUK10 쿠폰으로 10% 할인해 드립니다.', TRUE, TRUE, now(), now());`);
emit(`INSERT INTO notices (title, body, pinned, published, created_at, updated_at) VALUES ('배송 안내', '평일 오후 2시 이전 결제 건은 당일 출고됩니다. 주말과 공휴일 주문은 다음 영업일에 출고됩니다.', FALSE, TRUE, now(), now());`);
emit('');

emit(`INSERT INTO users (email, password_hash, name, phone, role, status, marketing_agreed, created_at, updated_at) VALUES ('admin@tukfit.local', '{{ADMIN_HASH}}', '관리자', '010-0000-0000', 'ADMIN', 'ACTIVE', FALSE, now(), now());`);
emit(`INSERT INTO users (email, password_hash, name, phone, role, status, marketing_agreed, created_at, updated_at) VALUES ('user@tukfit.local', '{{USER_HASH}}', '김툭핏', '010-1234-5678', 'USER', 'ACTIVE', TRUE, now(), now());`);
const reviewers = ['이준호', '박서준', '최민재', '정우진', '강도윤'];
reviewers.forEach((name, i) => {
  emit(`INSERT INTO users (email, name, role, status, marketing_agreed, created_at, updated_at) VALUES ('reviewer${i + 1}@tukfit.local', ${q(name)}, 'USER', 'ACTIVE', FALSE, now(), now());`);
});
emit(`INSERT INTO addresses (user_id, label, recipient, phone, postal_code, address1, address2, is_default, created_at, updated_at) VALUES ((SELECT id FROM users WHERE email = 'user@tukfit.local'), '집', '김툭핏', '010-1234-5678', '04524', '서울 중구 세종대로 110', '101동 1001호', TRUE, now(), now());`);
emit('');

// 데모 리뷰: 앞쪽 상품 몇 개에 리뷰를 단다.
const bodies = [
  ['핏이 정말 좋아요', '어깨선이 자연스럽게 떨어지고 기장도 딱 좋습니다. 소재도 생각보다 훨씬 고급스러워요.', 5, 'TRUE'],
  ['한 사이즈 크게 나와요', '평소 L 입는데 M이 맞았습니다. 그래도 색감과 마감은 만족스러워요.', 4, 'LARGE'],
  ['재구매 의사 있어요', '매일 입고 있어요. 세탁 후에도 형태가 잘 유지됩니다.', 5, 'TRUE'],
  ['조금 작아요', '어깨가 넓은 편이라 살짝 끼는 느낌이 있어요. 한 치수 크게 추천합니다.', 3, 'SMALL'],
];
PRODUCTS.slice(0, 8).forEach((p, pi) => {
  const pid = `(SELECT id FROM products WHERE slug = ${q(p.slug)})`;
  for (let k = 0; k < 3; k++) {
    const [title, body, rating, fit] = bodies[(pi + k) % bodies.length];
    const color = p.colors[k % p.colors.length];
    const size = p.sizes[(pi + k) % p.sizes.length];
    emit(`INSERT INTO reviews (product_id, user_id, option_label, rating, title, body, height_cm, fit_feedback, status, created_at, updated_at) VALUES (${pid}, (SELECT id FROM users WHERE email = 'reviewer${((pi + k) % reviewers.length) + 1}@tukfit.local'), ${q(`${color.name} / ${size}`)}, ${rating}, ${q(title)}, ${q(body)}, ${170 + ((pi * 3 + k * 5) % 16)}, '${fit}', 'VISIBLE', now() - interval '${pi * 3 + k + 1} days', now());`);
  }
});
emit('');

// 테스트 회원의 배송 완료 주문 1건 (리뷰·반품 테스트용)
const o1 = PRODUCTS[0];
const o2 = PRODUCTS[8];
const item = (p) => {
  const c = p.colors[0];
  const size = p.sizes[1];
  const sku = `TF${String(PRODUCTS.indexOf(p) + 1).padStart(3, '0')}-${c.id}-${size}`.toUpperCase();
  return { p, c, size, sku, key: `products/${p.slug}-${c.id}-01.webp` };
};
const items = [item(o1), item(o2)];
const subtotal = items.reduce((s, it) => s + it.p.price, 0);
const shipping = subtotal >= 50000 ? 0 : 3000;
const orderNo = '20261001-DEMO01';
emit(`INSERT INTO orders (order_number, user_id, status, order_name, subtotal, discount, shipping_fee, total, recipient, recipient_phone, postal_code, address1, address2, delivery_memo, orderer_name, orderer_email, orderer_phone, from_cart, paid_at, created_at, updated_at) VALUES ('${orderNo}', (SELECT id FROM users WHERE email = 'user@tukfit.local'), 'DELIVERED', ${q(`${o1.name} 외 1건`)}, ${subtotal}, 0, ${shipping}, ${subtotal + shipping}, '김툭핏', '010-1234-5678', '04524', '서울 중구 세종대로 110', '101동 1001호', '문 앞에 놓아주세요', '김툭핏', 'user@tukfit.local', '010-1234-5678', TRUE, now() - interval '5 days', now() - interval '5 days', now());`);
const oid = `(SELECT id FROM orders WHERE order_number = '${orderNo}')`;
items.forEach((it) => {
  emit(`INSERT INTO order_items (order_id, variant_id, product_id, product_slug, product_name, color_name, size, image_key, unit_price, quantity, line_total, created_at, updated_at) VALUES (${oid}, (SELECT id FROM product_variants WHERE sku = '${it.sku}'), (SELECT id FROM products WHERE slug = ${q(it.p.slug)}), ${q(it.p.slug)}, ${q(it.p.name)}, ${q(it.c.name)}, ${q(it.size)}, ${q(it.key)}, ${it.p.price}, 1, ${it.p.price}, now() - interval '5 days', now());`);
});
emit(`INSERT INTO payments (order_id, provider, pg_payment_key, method, status, amount, cancelled_amount, approved_at, created_at, updated_at) VALUES (${oid}, 'MOCK', 'mock_demo_0001', '카드', 'PAID', ${subtotal + shipping}, 0, now() - interval '5 days', now() - interval '5 days', now());`);
emit(`INSERT INTO shipments (order_id, carrier, tracking_number, shipped_at, delivered_at, created_at, updated_at) VALUES (${oid}, 'CJ', '123456789012', now() - interval '4 days', now() - interval '2 days', now(), now());`);
[['NULL', 'PENDING_PAYMENT', 5], ["'PENDING_PAYMENT'", 'PAID', 5], ["'PAID'", 'PREPARING', 4], ["'PREPARING'", 'SHIPPED', 4], ["'SHIPPED'", 'DELIVERED', 2]].forEach(([from, to, d]) => {
  emit(`INSERT INTO order_status_histories (order_id, from_status, to_status, created_at, updated_at) VALUES (${oid}, ${from}, '${to}', now() - interval '${d} days', now() - interval '${d} days');`);
});

writeFileSync(join(root, 'backend', 'src', 'main', 'resources', 'db', 'seed', 'dev-seed.sql'), out.join('\n') + '\n');
console.log(`dev-seed.sql: ${PRODUCTS.length} products, ${out.length} lines`);
