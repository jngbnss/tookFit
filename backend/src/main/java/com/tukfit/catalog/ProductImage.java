package com.tukfit.catalog;

import com.tukfit.global.entity.BaseEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "product_images")
public class ProductImage extends BaseEntity {

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "product_id")
	private Product product;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "color_id")
	private ProductColor color;

	private String storageKey;
	private String alt;
	private int sortOrder;

	protected ProductImage() {
	}

	public ProductImage(Product product) {
		this.product = product;
	}

	public void update(ProductColor color, String storageKey, String alt, int sortOrder) {
		this.color = color;
		this.storageKey = storageKey;
		this.alt = alt;
		this.sortOrder = sortOrder;
	}

	public void detachColor() {
		this.color = null;
	}

	public Long colorId() {
		return color == null ? null : color.getId();
	}

	public Product getProduct() {
		return product;
	}

	public ProductColor getColor() {
		return color;
	}

	public String getStorageKey() {
		return storageKey;
	}

	public String getAlt() {
		return alt;
	}

	public int getSortOrder() {
		return sortOrder;
	}
}
