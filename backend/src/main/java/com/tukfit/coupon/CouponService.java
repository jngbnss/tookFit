package com.tukfit.coupon;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tukfit.global.error.ApiException;
import com.tukfit.global.error.ErrorCode;
import com.tukfit.order.OrderRepository;
import com.tukfit.order.OrderStatus;

@Service
public class CouponService {

	/** 회원별 사용 횟수에 포함하는 주문 상태 (취소·만료·결제 전 제외) */
	private static final List<OrderStatus> USED_STATUSES = List.of(OrderStatus.PAID, OrderStatus.PREPARING,
			OrderStatus.SHIPPED, OrderStatus.DELIVERED);

	private final CouponRepository coupons;
	private final OrderRepository orders;

	public CouponService(CouponRepository coupons, OrderRepository orders) {
		this.coupons = coupons;
		this.orders = orders;
	}

	/** 쿠폰을 검증하고 할인액을 계산한다. 쓸 수 없으면 COUPON_INVALID와 이유를 던진다. */
	@Transactional(readOnly = true, noRollbackFor = ApiException.class)
	public Applied apply(String code, Long userId, long subtotal) {
		Coupon coupon = coupons.findByCodeIgnoreCase(code.trim())
				.orElseThrow(() -> invalid("존재하지 않는 쿠폰이에요."));
		Instant now = Instant.now();
		if (!coupon.isActive()) {
			throw invalid("사용이 중지된 쿠폰이에요.");
		}
		if (coupon.getStartsAt() != null && now.isBefore(coupon.getStartsAt())) {
			throw invalid("아직 사용할 수 없는 쿠폰이에요.");
		}
		if (coupon.getEndsAt() != null && !now.isBefore(coupon.getEndsAt())) {
			throw invalid("사용 기간이 끝난 쿠폰이에요.");
		}
		if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
			throw invalid("선착순 사용이 마감된 쿠폰이에요.");
		}
		if (orders.countByUserIdAndCouponIdAndStatusIn(userId, coupon.getId(), USED_STATUSES) >= coupon
				.getPerUserLimit()) {
			throw invalid("이미 사용한 쿠폰이에요.");
		}
		if (subtotal < coupon.getMinOrderAmount()) {
			throw invalid(String.format("%,d원 이상 구매 시 사용할 수 있어요.", coupon.getMinOrderAmount()));
		}
		return new Applied(coupon, coupon.discountFor(subtotal));
	}

	private static ApiException invalid(String message) {
		return new ApiException(ErrorCode.COUPON_INVALID, message);
	}

	public record Applied(Coupon coupon, long discount) {
	}
}
