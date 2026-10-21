package com.tukfit.order;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.tukfit.catalog.Inventory;
import com.tukfit.coupon.CouponRepository;
import com.tukfit.payment.RefundService;

/** 주문 전체 취소: 전액 환불 → 재고 복구 → 쿠폰 사용 횟수 되돌리기 → CANCELLED. */
@Component
public class OrderCancellation {

	private final RefundService refunds;
	private final Inventory inventory;
	private final CouponRepository coupons;

	public OrderCancellation(RefundService refunds, Inventory inventory, CouponRepository coupons) {
		this.refunds = refunds;
		this.inventory = inventory;
		this.coupons = coupons;
	}

	/** 호출하는 쪽에서 주문 잠금과 상태 검증을 끝낸 뒤 부른다. */
	@Transactional(propagation = Propagation.MANDATORY)
	public void cancel(Order order, Long actorId, String reason) {
		refunds.refund(order.getId(), refunds.refundableAmount(order.getId()), reason,
				"cancel-" + order.getOrderNumber());
		inventory.restore(order.getItems().stream()
				.map(i -> new Inventory.Line(i.getVariantId(), i.getQuantity(), null)).toList());
		if (order.getCouponId() != null) {
			coupons.decreaseUsage(order.getCouponId());
		}
		order.changeStatus(OrderStatus.CANCELLED, actorId, reason);
	}
}
