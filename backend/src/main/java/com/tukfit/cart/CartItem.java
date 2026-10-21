package com.tukfit.cart;

import com.tukfit.catalog.ProductVariant;
import com.tukfit.global.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "cart_items")
public class CartItem extends BaseEntity {

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "variant_id")
	private ProductVariant variant;

	private int quantity;

	protected CartItem() {
	}

	public CartItem(Long userId, ProductVariant variant, int quantity) {
		this.userId = userId;
		this.variant = variant;
		this.quantity = quantity;
	}

	public void changeQuantity(int quantity) {
		this.quantity = quantity;
	}

	public Long getUserId() {
		return userId;
	}

	public ProductVariant getVariant() {
		return variant;
	}

	public int getQuantity() {
		return quantity;
	}
}
