package com.tukfit.coupon;

import java.time.Instant;

import com.tukfit.global.entity.BaseEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "coupons")
public class Coupon extends BaseEntity {

	private String code;
	private String name;

	@Enumerated(EnumType.STRING)
	private DiscountType discountType;

	private long discountValue;
	private Long maxDiscount;
	private long minOrderAmount;
	private Instant startsAt;
	private Instant endsAt;
	private Integer usageLimit;
	private int perUserLimit;
	private int usedCount;
	private boolean active;

	public void update(String code, String name, DiscountType discountType, long discountValue, Long maxDiscount,
			long minOrderAmount, Instant startsAt, Instant endsAt, Integer usageLimit, int perUserLimit,
			boolean active) {
		this.code = code;
		this.name = name;
		this.discountType = discountType;
		this.discountValue = discountValue;
		this.maxDiscount = maxDiscount;
		this.minOrderAmount = minOrderAmount;
		this.startsAt = startsAt;
		this.endsAt = endsAt;
		this.usageLimit = usageLimit;
		this.perUserLimit = perUserLimit;
		this.active = active;
	}

	/** 상품 금액에 대한 할인액. 상한과 상품 금액을 넘지 않는다. */
	public long discountFor(long subtotal) {
		long discount = switch (discountType) {
			case PERCENT -> subtotal * discountValue / 100;
			case FIXED -> discountValue;
		};
		if (maxDiscount != null) {
			discount = Math.min(discount, maxDiscount);
		}
		return Math.max(0, Math.min(discount, subtotal));
	}

	public String getCode() {
		return code;
	}

	public String getName() {
		return name;
	}

	public DiscountType getDiscountType() {
		return discountType;
	}

	public long getDiscountValue() {
		return discountValue;
	}

	public Long getMaxDiscount() {
		return maxDiscount;
	}

	public long getMinOrderAmount() {
		return minOrderAmount;
	}

	public Instant getStartsAt() {
		return startsAt;
	}

	public Instant getEndsAt() {
		return endsAt;
	}

	public Integer getUsageLimit() {
		return usageLimit;
	}

	public int getPerUserLimit() {
		return perUserLimit;
	}

	public int getUsedCount() {
		return usedCount;
	}

	public boolean isActive() {
		return active;
	}
}
