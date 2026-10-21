package com.tukfit.catalog;

import com.tukfit.global.entity.BaseEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** 재고 관리 단위: 상품 × 색상 × 사이즈. */
@Entity
@Table(name = "product_variants")
public class ProductVariant extends BaseEntity {

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "product_id")
	private Product product;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "color_id")
	private ProductColor color;

	private String size;
	private String sku;
	private int stock;
	private boolean active;

	protected ProductVariant() {
	}

	public ProductVariant(Product product, ProductColor color, String size, String sku, int stock, boolean active) {
		this.product = product;
		this.color = color;
		this.size = size;
		update(sku, stock, active);
	}

	public void update(String sku, int stock, boolean active) {
		this.sku = sku;
		this.stock = stock;
		this.active = active;
	}

	public void deactivate() {
		this.active = false;
	}

	public void setStock(int stock) {
		this.stock = stock;
	}

	public boolean isAvailable() {
		return active && stock > 0;
	}

	/** "블랙 / M" */
	public String optionLabel() {
		return color.getName() + " / " + size;
	}

	public Product getProduct() {
		return product;
	}

	public ProductColor getColor() {
		return color;
	}

	public String getSize() {
		return size;
	}

	public String getSku() {
		return sku;
	}

	public int getStock() {
		return stock;
	}

	public boolean isActive() {
		return active;
	}
}
