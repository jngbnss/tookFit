package com.tukfit.payment;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.tukfit.global.entity.BaseEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

/** 이미 처리한 웹훅 이벤트. 같은 이벤트가 다시 오면 건너뛴다. */
@Entity
@Table(name = "payment_webhook_events")
public class PaymentWebhookEvent extends BaseEntity {

	@Enumerated(EnumType.STRING)
	private PaymentProvider provider;

	private String eventKey;

	@JdbcTypeCode(SqlTypes.JSON)
	private String payload;

	protected PaymentWebhookEvent() {
	}

	public PaymentWebhookEvent(PaymentProvider provider, String eventKey, String payload) {
		this.provider = provider;
		this.eventKey = eventKey;
		this.payload = payload;
	}
}
