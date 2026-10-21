package com.tukfit.review;

import com.tukfit.global.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "reviews")
public class Review extends BaseEntity {

	@Column(name = "product_id", nullable = false)
	private Long productId;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	/** 시드 데모 리뷰는 주문 상품 없이 들어갈 수 있다. */
	@Column(name = "order_item_id")
	private Long orderItemId;

	private String optionLabel;
	private short rating;
	private String title;
	private String body;
	private Short heightCm;

	@Enumerated(EnumType.STRING)
	private FitFeedback fitFeedback;

	@Enumerated(EnumType.STRING)
	private ReviewStatus status;

	protected Review() {
	}

	public Review(Long productId, Long userId, Long orderItemId, String optionLabel) {
		this.productId = productId;
		this.userId = userId;
		this.orderItemId = orderItemId;
		this.optionLabel = optionLabel;
		this.status = ReviewStatus.VISIBLE;
	}

	public void update(int rating, String title, String body, Integer heightCm, FitFeedback fitFeedback) {
		this.rating = (short) rating;
		this.title = title;
		this.body = body;
		this.heightCm = heightCm == null ? null : heightCm.shortValue();
		this.fitFeedback = fitFeedback;
	}

	public void changeStatus(ReviewStatus status) {
		this.status = status;
	}

	public Long getProductId() {
		return productId;
	}

	public Long getUserId() {
		return userId;
	}

	public Long getOrderItemId() {
		return orderItemId;
	}

	public String getOptionLabel() {
		return optionLabel;
	}

	public int getRating() {
		return rating;
	}

	public String getTitle() {
		return title;
	}

	public String getBody() {
		return body;
	}

	public Integer getHeightCm() {
		return heightCm == null ? null : heightCm.intValue();
	}

	public FitFeedback getFitFeedback() {
		return fitFeedback;
	}

	public ReviewStatus getStatus() {
		return status;
	}
}
