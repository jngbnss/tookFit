package com.tukfit.order;

import java.util.List;

/**
 * PENDING_PAYMENT ─결제 승인─▶ PAID ─▶ PREPARING ─▶ SHIPPED ─▶ DELIVERED
 *       └─ 30분 초과 ─▶ EXPIRED     └──────────┴─ 취소 ─▶ CANCELLED
 */
public enum OrderStatus {
	PENDING_PAYMENT, PAID, PREPARING, SHIPPED, DELIVERED, CANCELLED, EXPIRED;

	/** 관리자가 고를 수 있는 다음 상태 */
	public List<OrderStatus> nextStatuses() {
		return switch (this) {
			case PAID -> List.of(PREPARING, CANCELLED);
			case PREPARING -> List.of(SHIPPED, CANCELLED);
			case SHIPPED -> List.of(DELIVERED);
			default -> List.of();
		};
	}

	public boolean adminCancellable() {
		return this == PAID || this == PREPARING;
	}
}
