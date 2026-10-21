package com.tukfit.catalog;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.tukfit.catalog.CatalogDtos.CategoryRef;
import com.tukfit.catalog.CatalogDtos.ColorDto;
import com.tukfit.catalog.CatalogDtos.ImageDto;
import com.tukfit.catalog.CatalogDtos.ProductDetail;
import com.tukfit.catalog.CatalogDtos.ProductSummary;
import com.tukfit.catalog.CatalogDtos.Rating;
import com.tukfit.catalog.CatalogDtos.VariantDto;
import com.tukfit.review.ReviewRepository;
import com.tukfit.storage.ImageUrls;

/** 상품 엔티티를 API 응답으로 바꾼다. 평점은 한 번의 쿼리로 모아서 붙인다. */
@Component
public class ProductMapper {

	private final ImageUrls imageUrls;
	private final ReviewRepository reviews;

	public ProductMapper(ImageUrls imageUrls, ReviewRepository reviews) {
		this.imageUrls = imageUrls;
		this.reviews = reviews;
	}

	public List<ProductSummary> summaries(List<Product> products) {
		Map<Long, Rating> ratings = ratings(products.stream().map(Product::getId).toList());
		return products.stream().map(p -> summary(p, ratings.getOrDefault(p.getId(), Rating.NONE))).toList();
	}

	public ProductSummary summary(Product p, Rating rating) {
		List<ProductImage> images = p.getImages();
		return new ProductSummary(p.getId(), p.getSlug(), p.getName(), categoryRef(p), p.getPrice(),
				p.getOriginalPrice(), p.discountRate(), p.getBadge(), imageAt(images, 0), imageAt(images, 1),
				p.getColors().stream().map(ColorDto::of).toList(), p.inStock(), rating);
	}

	public ProductDetail detail(Product p) {
		Rating rating = ratings(List.of(p.getId())).getOrDefault(p.getId(), Rating.NONE);
		ProductSummary s = summary(p, rating);
		return new ProductDetail(s.id(), s.slug(), s.name(), s.category(), s.price(), s.originalPrice(),
				s.discountRate(), s.badge(), s.thumbnailUrl(), s.hoverImageUrl(), s.colors(), s.inStock(), rating,
				p.getDescription(), p.getMaterial(), p.getFit(), p.careList(), p.sizes(), images(p),
				p.getVariants().stream().filter(ProductVariant::isActive).map(VariantDto::of).toList());
	}

	public List<ImageDto> images(Product p) {
		return p.getImages().stream()
				.map(i -> new ImageDto(i.getId(), imageUrls.url(i.getStorageKey()), i.getAlt(), i.colorId(),
						i.getSortOrder()))
				.toList();
	}

	public String thumbnail(Product p) {
		return imageAt(p.getImages(), 0);
	}

	public Map<Long, Rating> ratings(Collection<Long> productIds) {
		Map<Long, Rating> result = new HashMap<>();
		if (productIds.isEmpty()) {
			return result;
		}
		for (Object[] row : reviews.ratingStats(productIds)) {
			double avg = ((Number) row[1]).doubleValue();
			result.put((Long) row[0], new Rating(Math.round(avg * 10) / 10.0, ((Number) row[2]).longValue()));
		}
		return result;
	}

	private CategoryRef categoryRef(Product p) {
		return new CategoryRef(p.getCategory().getSlug(), p.getCategory().getName());
	}

	private String imageAt(List<ProductImage> images, int index) {
		return images.size() > index ? imageUrls.url(images.get(index).getStorageKey()) : null;
	}
}
