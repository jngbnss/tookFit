package com.tukfit.payment;

import java.time.Instant;

/**
 * PG사 연동 지점. PG사를 바꾸거나 추가할 때는 이 인터페이스의 구현체만 만든다.
 * 구현체는 실패 시 {@link PaymentGatewayException}을 던진다.
 */
public interface PaymentGateway {

	PaymentProvider provider();

	/** 프론트 결제창에 넘길 공개 키. 없으면 null. */
	String clientKey();

	/** 결제 승인. 금액 검증은 호출하는 쪽에서 먼저 끝낸다. */
	Result confirm(String paymentKey, String orderNumber, long amount);

	/** 결제 취소. amount가 남은 금액보다 작으면 부분 취소. */
	Result cancel(String paymentKey, long amount, String reason, String idempotencyKey);

	/** PG에 저장된 결제 상태를 다시 조회한다 (웹훅 검증용). */
	Result fetch(String paymentKey);

	enum Status {
		READY, PAID, CANCELLED, PARTIAL_CANCELLED, FAILED
	}

	record Result(String paymentKey, String orderNumber, long totalAmount, long cancelledAmount, Status status,
			String method, Instant approvedAt, String rawJson) {
	}
}
