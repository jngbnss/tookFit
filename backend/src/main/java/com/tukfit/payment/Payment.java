package com.tukfit.payment;

import java.time.Instant;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.tukfit.global.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "payments")
public class Payment extends BaseEntity {

	@Column(name = "order_id", nullable = false)
	private Long orderId;

	@Enumerated(EnumType.STRING)
	private PaymentProvider provider;

	private String pgPaymentKey;
	private String method;

	@Enumerated(EnumType.STRING)
	private PaymentStatus status;

	private long amount;
	private long cancelledAmount;
	private Instant approvedAt;
	private String failureReason;

	@JdbcTypeCode(SqlTypes.JSON)
	private String rawResponse;

	protected Payment() {
	}

	public Payment(Long orderId, PaymentProvider provider, String pgPaymentKey, long amount) {
		this.orderId = orderId;
		this.provider = provider;
		this.pgPaymentKey = pgPaymentKey;
		this.amount = amount;
		this.status = PaymentStatus.READY;
	}

	public void approve(String method, Instant approvedAt, String rawResponse) {
		this.status = PaymentStatus.PAID;
		this.method = method;
		this.approvedAt = approvedAt == null ? Instant.now() : approvedAt;
		this.rawResponse = rawResponse;
	}

	public void fail(String reason, String rawResponse) {
		this.status = PaymentStatus.FAILED;
		this.failureReason = truncate(reason);
		if (rawResponse != null) {
			this.rawResponse = rawResponse;
		}
	}

	/** 누적 취소 금액을 반영한다. */
	public void applyCancel(long cancelledTotal, String reason, String rawResponse) {
		this.cancelledAmount = Math.min(cancelledTotal, amount);
		this.status = cancelledAmount >= amount ? PaymentStatus.CANCELLED : PaymentStatus.PARTIAL_CANCELLED;
		if (reason != null) {
			this.failureReason = truncate(reason);
		}
		if (rawResponse != null) {
			this.rawResponse = rawResponse;
		}
	}

	public long remaining() {
		return amount - cancelledAmount;
	}

	public boolean isRefundable() {
		return (status == PaymentStatus.PAID || status == PaymentStatus.PARTIAL_CANCELLED) && remaining() > 0;
	}

	private static String truncate(String value) {
		return value == null || value.length() <= 255 ? value : value.substring(0, 255);
	}

	public Long getOrderId() {
		return orderId;
	}

	public PaymentProvider getProvider() {
		return provider;
	}

	public String getPgPaymentKey() {
		return pgPaymentKey;
	}

	public String getMethod() {
		return method;
	}

	public PaymentStatus getStatus() {
		return status;
	}

	public long getAmount() {
		return amount;
	}

	public long getCancelledAmount() {
		return cancelledAmount;
	}

	public Instant getApprovedAt() {
		return approvedAt;
	}

	public String getFailureReason() {
		return failureReason;
	}
}
