package com.tukfit.order;

import com.tukfit.global.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** 반품·교환 요청 */
@Entity
@Table(name = "order_claims")
public class OrderClaim extends BaseEntity {

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "order_item_id")
	private OrderItem orderItem;

	@Enumerated(EnumType.STRING)
	private ClaimType type;

	@Enumerated(EnumType.STRING)
	private ClaimReason reasonType;

	private String reasonDetail;
	private int quantity;

	@Enumerated(EnumType.STRING)
	private ClaimStatus status;

	private long returnShippingFee;
	private Long refundAmount;

	@Column(name = "exchange_variant_id")
	private Long exchangeVariantId;

	protected OrderClaim() {
	}

	public OrderClaim(OrderItem orderItem, ClaimType type, ClaimReason reasonType, String reasonDetail, int quantity,
			long returnShippingFee, Long exchangeVariantId) {
		this.orderItem = orderItem;
		this.type = type;
		this.reasonType = reasonType;
		this.reasonDetail = reasonDetail;
		this.quantity = quantity;
		this.returnShippingFee = returnShippingFee;
		this.exchangeVariantId = exchangeVariantId;
		this.status = ClaimStatus.REQUESTED;
	}

	public void changeStatus(ClaimStatus status) {
		this.status = status;
	}

	public void setReturnShippingFee(long returnShippingFee) {
		this.returnShippingFee = returnShippingFee;
	}

	public void setRefundAmount(Long refundAmount) {
		this.refundAmount = refundAmount;
	}

	public OrderItem getOrderItem() {
		return orderItem;
	}

	public ClaimType getType() {
		return type;
	}

	public ClaimReason getReasonType() {
		return reasonType;
	}

	public String getReasonDetail() {
		return reasonDetail;
	}

	public int getQuantity() {
		return quantity;
	}

	public ClaimStatus getStatus() {
		return status;
	}

	public long getReturnShippingFee() {
		return returnShippingFee;
	}

	public Long getRefundAmount() {
		return refundAmount;
	}

	public Long getExchangeVariantId() {
		return exchangeVariantId;
	}
}
