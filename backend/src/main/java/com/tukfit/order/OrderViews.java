package com.tukfit.order;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.tukfit.order.OrderDtos.ClaimDto;
import com.tukfit.order.OrderDtos.HistoryDto;
import com.tukfit.order.OrderDtos.OrderDetail;
import com.tukfit.order.OrderDtos.OrderItemDto;
import com.tukfit.order.OrderDtos.OrderSummary;
import com.tukfit.order.OrderDtos.PaymentDto;
import com.tukfit.order.OrderDtos.ShipmentDto;
import com.tukfit.order.OrderDtos.ShippingDto;
import com.tukfit.payment.Payment;
import com.tukfit.payment.PaymentRepository;
import com.tukfit.payment.PaymentStatus;
import com.tukfit.review.Review;
import com.tukfit.review.ReviewRepository;
import com.tukfit.storage.ImageUrls;

/** 주문 엔티티를 고객·관리자 화면용 응답으로 바꾼다. */
@Component
public class OrderViews {

	private final ImageUrls imageUrls;
	private final PaymentRepository payments;
	private final ShipmentRepository shipments;
	private final OrderClaimRepository claims;
	private final ReviewRepository reviews;

	public OrderViews(ImageUrls imageUrls, PaymentRepository payments, ShipmentRepository shipments,
			OrderClaimRepository claims, ReviewRepository reviews) {
		this.imageUrls = imageUrls;
		this.payments = payments;
		this.shipments = shipments;
		this.claims = claims;
		this.reviews = reviews;
	}

	public OrderSummary summary(Order o) {
		return new OrderSummary(o.getOrderNumber(), o.getStatus(), o.getOrderName(), o.getTotal(), o.itemCount(),
				thumbnail(o), o.getCreatedAt());
	}

	public OrderDetail detail(Order o) {
		List<Payment> orderPayments = payments.findByOrderIdOrderByIdAsc(o.getId());
		Payment payment = mainPayment(orderPayments);
		Shipment shipment = shipments.findByOrderId(o.getId()).orElse(null);
		Set<Long> reviewed = reviews
				.findByOrderItemIdIn(o.getItems().stream().map(OrderItem::getId).toList()).stream()
				.map(Review::getOrderItemId).collect(Collectors.toSet());
		boolean delivered = o.getStatus() == OrderStatus.DELIVERED;

		List<OrderItemDto> items = o.getItems().stream()
				.map(i -> new OrderItemDto(i.getId(), i.getVariantId(), i.getProductId(), i.getProductSlug(),
						i.getProductName(), i.getColorName(), i.getSize(), imageUrls.url(i.getImageKey()),
						i.getUnitPrice(), i.getQuantity(), i.getLineTotal(), delivered && !reviewed.contains(i.getId()),
						reviewed.contains(i.getId())))
				.toList();

		return new OrderDetail(o.getOrderNumber(), o.getStatus(), o.getOrderName(), o.getTotal(), o.itemCount(),
				thumbnail(o), o.getCreatedAt(), items, o.totals(), o.getCouponCode(),
				new ShippingDto(o.getRecipient(), o.getRecipientPhone(), o.getPostalCode(), o.getAddress1(),
						o.getAddress2(), o.getDeliveryMemo()),
				payment == null ? null
						: new PaymentDto(payment.getProvider().name(), payment.getMethod(), payment.getStatus().name(),
								payment.getAmount(), payment.getCancelledAmount(), payment.getApprovedAt()),
				shipment == null || shipment.getCarrier() == null ? null : shipmentDto(shipment),
				claims.findByOrderId(o.getId()).stream().map(ClaimDto::of).toList(),
				o.getHistories().stream()
						.map(h -> new HistoryDto(h.getFromStatus(), h.getToStatus(), h.getReason(), h.getCreatedAt()))
						.toList(),
				o.getStatus() == OrderStatus.PAID, o.getPaidAt(), o.getCancelledAt());
	}

	public ShipmentDto shipmentDto(Shipment s) {
		return new ShipmentDto(s.getCarrier().name(), s.getCarrier().displayName(), s.getTrackingNumber(),
				s.getCarrier().trackingUrl(s.getTrackingNumber()), s.getShippedAt(), s.getDeliveredAt());
	}

	/** 화면에 보여줄 대표 결제: 승인된 결제가 있으면 그것, 없으면 마지막 시도 */
	public static Payment mainPayment(List<Payment> list) {
		return list.stream()
				.filter(p -> p.getStatus() != PaymentStatus.FAILED && p.getStatus() != PaymentStatus.READY)
				.max(Comparator.comparing(Payment::getId))
				.orElse(list.isEmpty() ? null : list.get(list.size() - 1));
	}

	public static <T> Map<Long, T> byId(List<T> list, Function<T, Long> id) {
		return list.stream().collect(Collectors.toMap(id, Function.identity(), (a, b) -> b));
	}

	private String thumbnail(Order o) {
		return o.getItems().isEmpty() ? null : imageUrls.url(o.getItems().get(0).getImageKey());
	}
}
