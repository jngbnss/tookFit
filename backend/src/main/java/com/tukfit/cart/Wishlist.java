package com.tukfit.cart;

import com.tukfit.global.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "wishlists")
public class Wishlist extends BaseEntity {

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Column(name = "product_id", nullable = false)
	private Long productId;

	protected Wishlist() {
	}

	public Wishlist(Long userId, Long productId) {
		this.userId = userId;
		this.productId = productId;
	}

	public Long getProductId() {
		return productId;
	}
}
