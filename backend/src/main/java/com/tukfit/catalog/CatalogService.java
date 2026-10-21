package com.tukfit.catalog;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tukfit.catalog.CatalogDtos.CategoryDto;
import com.tukfit.catalog.CatalogDtos.ProductDetail;
import com.tukfit.catalog.CatalogDtos.ProductSummary;
import com.tukfit.catalog.CatalogDtos.Suggestion;
import com.tukfit.global.error.ApiException;
import com.tukfit.global.error.ErrorCode;
import com.tukfit.global.web.PageResponse;

@Service
@Transactional(readOnly = true)
public class CatalogService {

	public static final int DEFAULT_PAGE_SIZE = 24;
	public static final int MAX_PAGE_SIZE = 60;

	private final CategoryRepository categories;
	private final ProductRepository products;
	private final ProductMapper mapper;

	public CatalogService(CategoryRepository categories, ProductRepository products, ProductMapper mapper) {
		this.categories = categories;
		this.products = products;
		this.mapper = mapper;
	}

	public List<CategoryDto> categories() {
		return categories.findByVisibleTrueOrderBySortOrderAscIdAsc().stream().map(CategoryDto::of).toList();
	}

	public PageResponse<ProductSummary> search(ProductSpecs.Filter filter, String sort, int page, int size) {
		Pageable pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, MAX_PAGE_SIZE), sortOf(sort));
		Page<Product> result = products.findAll(ProductSpecs.storefront(filter), pageable);
		List<ProductSummary> items = mapper.summaries(result.getContent());
		return new PageResponse<>(items, result.getNumber(), result.getSize(), result.getTotalElements(),
				result.getTotalPages());
	}

	public List<Suggestion> suggestions(String q) {
		if (q == null || q.isBlank()) {
			return List.of();
		}
		return products.suggest(q.trim(), PageRequest.of(0, 8)).stream()
				.map(p -> new Suggestion(p.getSlug(), p.getName(), mapper.thumbnail(p)))
				.toList();
	}

	public ProductDetail detail(String slug) {
		return mapper.detail(findActive(slug));
	}

	/** 같은 카테고리 상품으로 채우고, 모자라면 다른 카테고리 인기 상품으로 채운다. */
	public List<ProductSummary> related(String slug) {
		Product product = findActive(slug);
		Long categoryId = product.getCategory().getId();
		List<Product> list = new ArrayList<>(products.related(categoryId, product.getId(), PageRequest.of(0, 8)));
		if (list.size() < 8) {
			list.addAll(products.popularOutside(categoryId, PageRequest.of(0, 8 - list.size())));
		}
		return mapper.summaries(list);
	}

	public Product findActive(String slug) {
		return products.findBySlug(slug).filter(Product::isOnSale)
				.orElseThrow(() -> new ApiException(ErrorCode.PRODUCT_NOT_FOUND));
	}

	public static List<String> splitCsv(String value) {
		if (value == null || value.isBlank()) {
			return List.of();
		}
		return Arrays.stream(value.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
	}

	private Sort sortOf(String sort) {
		if (sort == null) {
			sort = "featured";
		}
		return switch (sort) {
			case "newest" -> Sort.by(Sort.Order.desc("publishedAt").nullsLast(), Sort.Order.desc("id"));
			case "price-asc" -> Sort.by(Sort.Order.asc("price"), Sort.Order.asc("id"));
			case "price-desc" -> Sort.by(Sort.Order.desc("price"), Sort.Order.asc("id"));
			default -> Sort.by(Sort.Order.asc("featuredRank").nullsLast(), Sort.Order.asc("id"));
		};
	}
}
