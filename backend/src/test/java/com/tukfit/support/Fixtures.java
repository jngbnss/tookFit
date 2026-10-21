package com.tukfit.support;

import java.util.List;
import java.util.UUID;

import org.springframework.boot.test.context.TestComponent;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.tukfit.user.Role;

/** 테스트마다 겹치지 않는 데이터를 SQL로 바로 넣는다. */
@TestComponent
public class Fixtures {

	private final JdbcTemplate jdbc;
	private final PasswordEncoder passwordEncoder;

	public Fixtures(JdbcTemplate jdbc, PasswordEncoder passwordEncoder) {
		this.jdbc = jdbc;
		this.passwordEncoder = passwordEncoder;
	}

	public String uniqueEmail() {
		return "u" + UUID.randomUUID().toString().substring(0, 8) + "@test.local";
	}

	public long user(String email, String password, Role role) {
		return jdbc.queryForObject("""
				INSERT INTO users (email, password_hash, name, phone, role, status, marketing_agreed, created_at, updated_at)
				VALUES (?, ?, '테스트', '010-0000-0000', ?, 'ACTIVE', false, now(), now()) RETURNING id
				""", Long.class, email, passwordEncoder.encode(password), role.name());
	}

	public long category(String slug) {
		Long existing = jdbc.query("SELECT id FROM categories WHERE slug = ?", rs -> rs.next() ? rs.getLong(1) : null,
				slug);
		if (existing != null) {
			return existing;
		}
		return jdbc.queryForObject("""
				INSERT INTO categories (slug, name, sort_order, visible, created_at, updated_at)
				VALUES (?, ?, 0, true, now(), now()) RETURNING id
				""", Long.class, slug, slug);
	}

	/** 색상 하나, 사이즈별 재고를 가진 판매 중 상품. 만든 상품의 정보를 돌려준다. */
	public TestProduct product(String category, long price, Long originalPrice, List<String> sizes, int stock,
			String colorName) {
		String slug = "p-" + UUID.randomUUID().toString().substring(0, 8);
		long categoryId = category(category);
		long productId = jdbc.queryForObject("""
				INSERT INTO products (slug, category_id, name, description, price, original_price, status, featured_rank,
				                      published_at, created_at, updated_at)
				VALUES (?, ?, ?, '설명', ?, ?, 'ACTIVE', 1, now(), now(), now()) RETURNING id
				""", Long.class, slug, categoryId, "상품 " + slug, price, originalPrice);
		long colorId = jdbc.queryForObject("""
				INSERT INTO product_colors (product_id, name, hex, sort_order, created_at, updated_at)
				VALUES (?, ?, '#111111', 0, now(), now()) RETURNING id
				""", Long.class, productId, colorName);
		List<Long> variantIds = sizes.stream().map(size -> jdbc.queryForObject("""
				INSERT INTO product_variants (product_id, color_id, size, sku, stock, active, created_at, updated_at)
				VALUES (?, ?, ?, ?, ?, true, now(), now()) RETURNING id
				""", Long.class, productId, colorId, size, (slug + "-" + size).toUpperCase(), stock)).toList();
		jdbc.update("""
				INSERT INTO product_images (product_id, color_id, storage_key, alt, sort_order, created_at, updated_at)
				VALUES (?, ?, ?, 'img', 0, now(), now())
				""", productId, colorId, "products/" + slug + ".webp");
		return new TestProduct(productId, slug, categoryId, colorId, variantIds);
	}

	public int stock(long variantId) {
		return jdbc.queryForObject("SELECT stock FROM product_variants WHERE id = ?", Integer.class, variantId);
	}

	public void coupon(String code, String type, long value, Long max, long minOrder, Integer usageLimit) {
		jdbc.update("""
				INSERT INTO coupons (code, name, discount_type, discount_value, max_discount, min_order_amount, usage_limit,
				                     per_user_limit, used_count, active, created_at, updated_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, true, now(), now())
				""", code, code + " 쿠폰", type, value, max, minOrder, usageLimit);
	}

	public JdbcTemplate jdbc() {
		return jdbc;
	}

	public record TestProduct(long id, String slug, long categoryId, long colorId, List<Long> variantIds) {

		public long variant(int index) {
			return variantIds.get(index);
		}
	}
}
