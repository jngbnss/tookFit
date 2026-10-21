package com.tukfit.payment;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * PG 키가 없는 동안 주문 흐름 전체를 시험하기 위한 모의 결제. 실제 돈은 오가지 않는다.
 * 상태는 메모리에만 두므로 웹훅 조회(fetch)는 DB 기준으로 판단한다.
 */
@Component
public class MockPaymentGateway implements PaymentGateway {

	private final Map<String, Result> payments = new ConcurrentHashMap<>();

	@Override
	public PaymentProvider provider() {
		return PaymentProvider.MOCK;
	}

	@Override
	public String clientKey() {
		return null;
	}

	@Override
	public Result confirm(String paymentKey, String orderNumber, long amount) {
		if (paymentKey == null || !paymentKey.startsWith("mock_")) {
			throw new PaymentGatewayException("INVALID_PAYMENT_KEY", "모의 결제 키가 아니에요.");
		}
		Result result = new Result(paymentKey, orderNumber, amount, 0, Status.PAID, "모의결제", Instant.now(),
				"{\"provider\":\"MOCK\",\"paymentKey\":\"" + paymentKey + "\"}");
		payments.put(paymentKey, result);
		return result;
	}

	@Override
	public Result cancel(String paymentKey, long amount, String reason, String idempotencyKey) {
		Result current = payments.get(paymentKey);
		long total = current == null ? amount : current.totalAmount();
		long cancelled = (current == null ? 0 : current.cancelledAmount()) + amount;
		Status status = cancelled >= total ? Status.CANCELLED : Status.PARTIAL_CANCELLED;
		Result result = new Result(paymentKey, current == null ? null : current.orderNumber(), total, cancelled,
				status, "모의결제", current == null ? null : current.approvedAt(),
				"{\"provider\":\"MOCK\",\"cancelled\":" + cancelled + "}");
		payments.put(paymentKey, result);
		return result;
	}

	@Override
	public Result fetch(String paymentKey) {
		Result result = payments.get(paymentKey);
		if (result == null) {
			throw new PaymentGatewayException("NOT_FOUND_PAYMENT", "모의 결제를 찾을 수 없어요.");
		}
		return result;
	}
}
