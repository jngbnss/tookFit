package com.tukfit.catalog;

import com.tukfit.global.entity.BaseEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "product_colors")
public class ProductColor extends BaseEntity {

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "product_id")
	private Product product;

	private String name;
	private String hex;
	private int sortOrder;

	protected ProductColor() {
	}

	public ProductColor(Product product, String name, String hex, int sortOrder) {
		this.product = product;
		update(name, hex, sortOrder);
	}

	public void update(String name, String hex, int sortOrder) {
		this.name = name;
		this.hex = hex;
		this.sortOrder = sortOrder;
	}

	public Product getProduct() {
		return product;
	}

	public String getName() {
		return name;
	}

	public String getHex() {
		return hex;
	}

	public int getSortOrder() {
		return sortOrder;
	}
}
