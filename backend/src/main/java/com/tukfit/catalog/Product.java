package com.tukfit.catalog;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

import org.hibernate.annotations.BatchSize;

import com.tukfit.global.entity.BaseEntity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

@Entity
@Table(name = "products")
public class Product extends BaseEntity {

	private String slug;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "category_id")
	private Category category;

	private String name;
	private String description;
	private long price;
	private Long originalPrice;

	@Enumerated(EnumType.STRING)
	private Badge badge;

	private String material;
	private String fit;
	private String care;

	@Enumerated(EnumType.STRING)
	private ProductStatus status;

	private Integer featuredRank;
	private Instant publishedAt;

	@BatchSize(size = 100)
	@OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("sortOrder ASC, id ASC")
	private List<ProductColor> colors = new ArrayList<>();

	@BatchSize(size = 100)
	@OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
	@OrderBy("id ASC")
	private List<ProductVariant> variants = new ArrayList<>();

	@BatchSize(size = 100)
	@OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("sortOrder ASC, id ASC")
	private List<ProductImage> images = new ArrayList<>();

	protected Product() {
	}

	public Product(String slug, Category category) {
		this.slug = slug;
		this.category = category;
		this.status = ProductStatus.DRAFT;
	}

	public void update(String slug, Category category, String name, String description, long price,
			Long originalPrice, Badge badge, String material, String fit, List<String> care, ProductStatus status,
			Integer featuredRank) {
		this.slug = slug;
		this.category = category;
		this.name = name;
		this.description = description;
		this.price = price;
		this.originalPrice = originalPrice;
		this.badge = badge;
		this.material = material;
		this.fit = fit;
		this.care = care == null || care.isEmpty() ? null : String.join("\n", care);
		changeStatus(status);
		this.featuredRank = featuredRank;
	}

	public void changeStatus(ProductStatus status) {
		if (status == ProductStatus.ACTIVE && publishedAt == null) {
			publishedAt = Instant.now();
		}
		this.status = status;
	}

	public boolean isOnSale() {
		return status == ProductStatus.ACTIVE;
	}

	public List<String> careList() {
		if (care == null || care.isBlank()) {
			return List.of();
		}
		return Arrays.stream(care.split("\n")).map(String::trim).filter(s -> !s.isEmpty()).toList();
	}

	public int discountRate() {
		if (originalPrice == null || originalPrice <= price || originalPrice == 0) {
			return 0;
		}
		return (int) Math.round((1 - (double) price / originalPrice) * 100);
	}

	/** 옵션의 사이즈를 표시 순서(처음 등록된 순)로 중복 없이 돌려준다. */
	public List<String> sizes() {
		return variants.stream().filter(ProductVariant::isActive)
				.sorted(Comparator.comparing(ProductVariant::getId))
				.map(ProductVariant::getSize).distinct().toList();
	}

	public boolean inStock() {
		return variants.stream().anyMatch(ProductVariant::isAvailable);
	}

	public String getSlug() {
		return slug;
	}

	public Category getCategory() {
		return category;
	}

	public String getName() {
		return name;
	}

	public String getDescription() {
		return description;
	}

	public long getPrice() {
		return price;
	}

	public Long getOriginalPrice() {
		return originalPrice;
	}

	public Badge getBadge() {
		return badge;
	}

	public String getMaterial() {
		return material;
	}

	public String getFit() {
		return fit;
	}

	public ProductStatus getStatus() {
		return status;
	}

	public Integer getFeaturedRank() {
		return featuredRank;
	}

	public Instant getPublishedAt() {
		return publishedAt;
	}

	public List<ProductColor> getColors() {
		return colors;
	}

	public List<ProductVariant> getVariants() {
		return variants;
	}

	public List<ProductImage> getImages() {
		return images;
	}
}
