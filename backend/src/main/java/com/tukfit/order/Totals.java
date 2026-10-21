package com.tukfit.order;

/** 금액 계산 결과. 모든 금액은 서버에서만 계산한다. */
public record Totals(long subtotal, long discount, long shippingFee, long total, int itemCount,
		long freeShippingRemaining) {
}
