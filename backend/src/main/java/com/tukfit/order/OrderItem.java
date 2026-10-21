package com.tukfit.order;

import com.tukfit.global.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** 주문 당시의 상품명·옵션·가격 스냅샷. */
@Entity
@Table(name = "order_items")
public class OrderItem extends BaseEntity {

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "order_id")
	private Order order;

	@Column(name = "variant_id", nullable = false)
	private Long variantId;

	@Column(name = "product_id", nullable = false)
	private Long productId;

	private String productSlug;
	private String productName;
	private String colorName;
	private String size;
	private String imageKey;
	private long unitPrice;
	private int quantity;
	private long lineTotal;

	protected OrderItem() {
	}

	public OrderItem(Order order, Long variantId, Long productId, String productSlug, String productName,
			String colorName, String size, String imageKey, long unitPrice, int quantity) {
		this.order = order;
		this.variantId = variantId;
		this.productId = productId;
		this.productSlug = productSlug;
		this.productName = productName;
		this.colorName = colorName;
		this.size = size;
		this.imageKey = imageKey;
		this.unitPrice = unitPrice;
		this.quantity = quantity;
		this.lineTotal = unitPrice * quantity;
	}

	public String optionLabel() {
		return colorName + " / " + size;
	}

	public Order getOrder() {
		return order;
	}

	public Long getVariantId() {
		return variantId;
	}

	public Long getProductId() {
		return productId;
	}

	public String getProductSlug() {
		return productSlug;
	}

	public String getProductName() {
		return productName;
	}

	public String getColorName() {
		return colorName;
	}

	public String getSize() {
		return size;
	}

	public String getImageKey() {
		return imageKey;
	}

	public long getUnitPrice() {
		return unitPrice;
	}

	public int getQuantity() {
		return quantity;
	}

	public long getLineTotal() {
		return lineTotal;
	}
}
