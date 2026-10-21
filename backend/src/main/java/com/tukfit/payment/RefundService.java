package com.tukfit.payment;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.tukfit.global.error.ApiException;
import com.tukfit.global.error.ErrorCode;

/** PG 환불(전체·부분). 주문 잠금을 잡은 트랜잭션 안에서 호출한다. */
@Service
public class RefundService {

	private static final Logger log = LoggerFactory.getLogger(RefundService.class);

	private final PaymentRepository payments;
	private final PaymentGateways gateways;

	public RefundService(PaymentRepository payments, PaymentGateways gateways) {
		this.payments = payments;
		this.gateways = gateways;
	}

	/**
	 * 승인된 결제에서 amount만큼 환불한다. 환불할 결제가 없거나 amount가 0이면 아무것도 하지 않는다.
	 * @return 실제로 환불한 금액
	 */
	@Transactional(propagation = Propagation.MANDATORY)
	public long refund(Long orderId, long amount, String reason, String idempotencyKey) {
		if (amount <= 0) {
			return 0;
		}
		Payment payment = refundable(orderId);
		if (payment == null) {
			return 0;
		}
		long cancelAmount = Math.min(amount, payment.remaining());
		try {
			PaymentGateway.Result result = gateways.get(payment.getProvider())
					.cancel(payment.getPgPaymentKey(), cancelAmount, reason, idempotencyKey);
			long cancelledTotal = Math.max(result.cancelledAmount(), payment.getCancelledAmount() + cancelAmount);
			payment.applyCancel(cancelledTotal, null, result.rawJson());
			return cancelAmount;
		}
		catch (PaymentGatewayException e) {
			log.warn("환불 실패 orderId={} code={} message={}", orderId, e.getCode(), e.getMessage());
			throw new ApiException(ErrorCode.PAYMENT_FAILED, "환불하지 못했어요: " + e.getMessage());
		}
	}

	public long refundableAmount(Long orderId) {
		Payment payment = refundable(orderId);
		return payment == null ? 0 : payment.remaining();
	}

	private Payment refundable(Long orderId) {
		List<Payment> list = payments.findByOrderIdOrderByIdAsc(orderId);
		return list.stream().filter(Payment::isRefundable).findFirst().orElse(null);
	}
}
