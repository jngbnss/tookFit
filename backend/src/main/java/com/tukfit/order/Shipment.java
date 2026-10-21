package com.tukfit.order;

import java.time.Instant;

import com.tukfit.global.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "shipments")
public class Shipment extends BaseEntity {

	@Column(name = "order_id", nullable = false)
	private Long orderId;

	@Enumerated(EnumType.STRING)
	private Carrier carrier;

	private String trackingNumber;
	private Instant shippedAt;
	private Instant deliveredAt;

	protected Shipment() {
	}

	public Shipment(Long orderId) {
		this.orderId = orderId;
	}

	public void ship(Carrier carrier, String trackingNumber) {
		this.carrier = carrier;
		this.trackingNumber = trackingNumber;
		if (shippedAt == null) {
			shippedAt = Instant.now();
		}
	}

	public void markDelivered() {
		if (deliveredAt == null) {
			deliveredAt = Instant.now();
		}
	}

	public Long getOrderId() {
		return orderId;
	}

	public Carrier getCarrier() {
		return carrier;
	}

	public String getTrackingNumber() {
		return trackingNumber;
	}

	public Instant getShippedAt() {
		return shippedAt;
	}

	public Instant getDeliveredAt() {
		return deliveredAt;
	}
}
