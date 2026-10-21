package com.tukfit.order;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.BatchSize;

import com.tukfit.global.entity.BaseEntity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

@Entity
@Table(name = "orders")
public class Order extends BaseEntity {

	private String orderNumber;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Enumerated(EnumType.STRING)
	private OrderStatus status;

	private String orderName;
	private long subtotal;
	private long discount;
	private long shippingFee;
	private long total;

	@Column(name = "coupon_id")
	private Long couponId;

	private String couponCode;
	private String recipient;
	private String recipientPhone;
	private String postalCode;
	private String address1;
	private String address2;
	private String deliveryMemo;
	private String ordererName;
	private String ordererEmail;
	private String ordererPhone;
	private boolean fromCart;
	private Instant paidAt;
	private Instant cancelledAt;

	@BatchSize(size = 100)
	@OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
	@OrderBy("id ASC")
	private List<OrderItem> items = new ArrayList<>();

	@BatchSize(size = 100)
	@OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
	@OrderBy("createdAt ASC, id ASC")
	private List<OrderStatusHistory> histories = new ArrayList<>();

	protected Order() {
	}

	public Order(String orderNumber, Long userId, String orderName, Totals totals, Long couponId, String couponCode,
			Recipient recipient, String deliveryMemo, Orderer orderer, boolean fromCart) {
		this.orderNumber = orderNumber;
		this.userId = userId;
		this.orderName = orderName;
		this.subtotal = totals.subtotal();
		this.discount = totals.discount();
		this.shippingFee = totals.shippingFee();
		this.total = totals.total();
		this.couponId = couponId;
		this.couponCode = couponCode;
		this.recipient = recipient.name();
		this.recipientPhone = recipient.phone();
		this.postalCode = recipient.postalCode();
		this.address1 = recipient.address1();
		this.address2 = recipient.address2();
		this.deliveryMemo = deliveryMemo;
		this.ordererName = orderer.name();
		this.ordererEmail = orderer.email();
		this.ordererPhone = orderer.phone();
		this.fromCart = fromCart;
		this.status = OrderStatus.PENDING_PAYMENT;
		this.histories.add(new OrderStatusHistory(this, null, OrderStatus.PENDING_PAYMENT, null, null));
	}

	public void addItem(OrderItem item) {
		items.add(item);
	}

	/** 상태를 바꾸고 이력을 남긴다. changedBy가 null이면 시스템 변경. */
	public void changeStatus(OrderStatus to, Long changedBy, String reason) {
		OrderStatus from = this.status;
		this.status = to;
		if (to == OrderStatus.PAID && paidAt == null) {
			paidAt = Instant.now();
		}
		if (to == OrderStatus.CANCELLED) {
			cancelledAt = Instant.now();
		}
		histories.add(new OrderStatusHistory(this, from, to, changedBy, reason));
	}

	public int itemCount() {
		return items.stream().mapToInt(OrderItem::getQuantity).sum();
	}

	public Totals totals() {
		return new Totals(subtotal, discount, shippingFee, total, itemCount(), 0);
	}

	public String getOrderNumber() {
		return orderNumber;
	}

	public Long getUserId() {
		return userId;
	}

	public OrderStatus getStatus() {
		return status;
	}

	public String getOrderName() {
		return orderName;
	}

	public long getSubtotal() {
		return subtotal;
	}

	public long getDiscount() {
		return discount;
	}

	public long getShippingFee() {
		return shippingFee;
	}

	public long getTotal() {
		return total;
	}

	public Long getCouponId() {
		return couponId;
	}

	public String getCouponCode() {
		return couponCode;
	}

	public String getRecipient() {
		return recipient;
	}

	public String getRecipientPhone() {
		return recipientPhone;
	}

	public String getPostalCode() {
		return postalCode;
	}

	public String getAddress1() {
		return address1;
	}

	public String getAddress2() {
		return address2;
	}

	public String getDeliveryMemo() {
		return deliveryMemo;
	}

	public String getOrdererName() {
		return ordererName;
	}

	public String getOrdererEmail() {
		return ordererEmail;
	}

	public String getOrdererPhone() {
		return ordererPhone;
	}

	public boolean isFromCart() {
		return fromCart;
	}

	public Instant getPaidAt() {
		return paidAt;
	}

	public Instant getCancelledAt() {
		return cancelledAt;
	}

	public List<OrderItem> getItems() {
		return items;
	}

	public List<OrderStatusHistory> getHistories() {
		return histories;
	}

	public record Recipient(String name, String phone, String postalCode, String address1, String address2) {
	}

	public record Orderer(String name, String email, String phone) {
	}
}
