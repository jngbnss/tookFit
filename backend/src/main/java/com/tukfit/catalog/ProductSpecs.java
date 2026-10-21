package com.tukfit.catalog;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;

/** 상품 목록 필터. 모든 조건은 AND로 묶인다. */
public final class ProductSpecs {

	/** 베스트 컬렉션에 들어가는 추천순 상위 개수 */
	static final int BEST_RANK_CUTOFF = 8;

	private ProductSpecs() {
	}

	public record Filter(String q, String collection, String category, List<String> sizes, List<String> colors,
			Long minPrice, Long maxPrice, boolean inStock) {
	}

	public static Specification<Product> storefront(Filter f) {
		return (root, query, cb) -> {
			List<Predicate> predicates = new ArrayList<>();
			predicates.add(cb.equal(root.get("status"), ProductStatus.ACTIVE));
			var category = root.join("category");
			predicates.add(cb.isTrue(category.get("visible")));

			if (f.q() != null && !f.q().isBlank()) {
				String like = "%" + f.q().trim().toLowerCase() + "%";
				predicates.add(cb.or(cb.like(cb.lower(root.get("name")), like),
						cb.like(cb.lower(category.get("name")), like),
						cb.like(cb.lower(root.get("description")), like)));
			}
			if (f.category() != null && !f.category().isBlank()) {
				predicates.add(cb.equal(category.get("slug"), f.category()));
			}
			if (f.collection() != null) {
				switch (f.collection()) {
					case "new-arrivals" -> predicates.add(cb.or(cb.equal(root.get("badge"), Badge.NEW),
							cb.greaterThanOrEqualTo(root.get("publishedAt"),
									Instant.now().minus(30, ChronoUnit.DAYS))));
					case "best-sellers" -> predicates.add(cb.or(cb.equal(root.get("badge"), Badge.BEST),
							cb.le(root.get("featuredRank"), BEST_RANK_CUTOFF)));
					case "sale" -> predicates.add(cb.and(cb.isNotNull(root.get("originalPrice")),
							cb.gt(root.get("originalPrice"), root.get("price"))));
					default -> {
					}
				}
			}
			if (f.minPrice() != null) {
				predicates.add(cb.ge(root.get("price"), f.minPrice()));
			}
			if (f.maxPrice() != null) {
				predicates.add(cb.le(root.get("price"), f.maxPrice()));
			}
			if (f.sizes() != null && !f.sizes().isEmpty()) {
				Subquery<Long> sq = query.subquery(Long.class);
				Root<ProductVariant> v = sq.from(ProductVariant.class);
				sq.select(v.get("id")).where(cb.equal(v.get("product"), root), cb.isTrue(v.get("active")),
						v.get("size").in(f.sizes()));
				predicates.add(cb.exists(sq));
			}
			if (f.colors() != null && !f.colors().isEmpty()) {
				Subquery<Long> sq = query.subquery(Long.class);
				Root<ProductColor> c = sq.from(ProductColor.class);
				sq.select(c.get("id")).where(cb.equal(c.get("product"), root), c.get("name").in(f.colors()));
				predicates.add(cb.exists(sq));
			}
			if (f.inStock()) {
				Subquery<Long> sq = query.subquery(Long.class);
				Root<ProductVariant> v = sq.from(ProductVariant.class);
				sq.select(v.get("id")).where(cb.equal(v.get("product"), root), cb.isTrue(v.get("active")),
						cb.gt(v.get("stock"), 0));
				predicates.add(cb.exists(sq));
			}
			return cb.and(predicates.toArray(Predicate[]::new));
		};
	}
}
