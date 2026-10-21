package com.tukfit.catalog;

import java.util.List;

public final class CatalogDtos {

	private CatalogDtos() {
	}

	public record CategoryDto(Long id, String slug, String name, int sortOrder) {

		public static CategoryDto of(Category c) {
			return new CategoryDto(c.getId(), c.getSlug(), c.getName(), c.getSortOrder());
		}
	}

	public record CategoryRef(String slug, String name) {
	}

	public record ColorDto(Long id, String name, String hex) {

		public static ColorDto of(ProductColor c) {
			return new ColorDto(c.getId(), c.getName(), c.getHex());
		}
	}

	public record ImageDto(Long id, String url, String alt, Long colorId, int sortOrder) {
	}

	public record VariantDto(Long id, Long colorId, String size, String sku, int stock, boolean available) {

		public static VariantDto of(ProductVariant v) {
			return new VariantDto(v.getId(), v.getColor().getId(), v.getSize(), v.getSku(), v.getStock(),
					v.isAvailable());
		}
	}

	public record Rating(double average, long count) {

		public static final Rating NONE = new Rating(0, 0);
	}

	public record ProductSummary(Long id, String slug, String name, CategoryRef category, long price,
			Long originalPrice, int discountRate, Badge badge, String thumbnailUrl, String hoverImageUrl,
			List<ColorDto> colors, boolean inStock, Rating rating) {
	}

	public record ProductDetail(Long id, String slug, String name, CategoryRef category, long price,
			Long originalPrice, int discountRate, Badge badge, String thumbnailUrl, String hoverImageUrl,
			List<ColorDto> colors, boolean inStock, Rating rating, String description, String material, String fit,
			List<String> care, List<String> sizes, List<ImageDto> images, List<VariantDto> variants) {
	}

	public record Suggestion(String slug, String name, String thumbnailUrl) {
	}
}
