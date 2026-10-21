package com.tukfit.admin;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tukfit.admin.AdminDtos.AdminClaim;
import com.tukfit.admin.AdminDtos.AdminOrderDetail;
import com.tukfit.admin.AdminDtos.AdminOrderSummary;
import com.tukfit.admin.AdminDtos.AdminPayment;
import com.tukfit.admin.AdminDtos.Orderer;
import com.tukfit.admin.AdminDtos.UserRef;
import com.tukfit.global.error.ApiException;
import com.tukfit.global.error.ErrorCode;
import com.tukfit.global.web.PageResponse;
import com.tukfit.order.Carrier;
import com.tukfit.order.ClaimService;
import com.tukfit.order.ClaimStatus;
import com.tukfit.order.Order;
import com.tukfit.order.OrderCancellation;
import com.tukfit.order.OrderClaim;
import com.tukfit.order.OrderClaimRepository;
import com.tukfit.order.OrderDtos.OrderDetail;
import com.tukfit.order.OrderRepository;
import com.tukfit.order.OrderStatus;
import com.tukfit.order.OrderViews;
import com.tukfit.order.Shipment;
import com.tukfit.order.ShipmentRepository;
import com.tukfit.payment.PaymentRepository;
import com.tukfit.user.User;
import com.tukfit.user.UserRepository;

import jakarta.persistence.criteria.Predicate;

@Service
@Transactional
public class AdminOrderService {

	private static final ZoneId KST = ZoneId.of("Asia/Seoul");
	private static final DateTimeFormatter CSV_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(KST);

	private final OrderRepository orders;
	private final OrderViews views;
	private final PaymentRepository payments;
	private final ShipmentRepository shipments;
	private final UserRepository users;
	private final OrderCancellation cancellation;
	private final OrderClaimRepository claims;
	private final ClaimService claimService;

	public AdminOrderService(OrderRepository orders, OrderViews views, PaymentRepository payments,
			ShipmentRepository shipments, UserRepository users, OrderCancellation cancellation,
			OrderClaimRepository claims, ClaimService claimService) {
		this.orders = orders;
		this.views = views;
		this.payments = payments;
		this.shipments = shipments;
		this.users = users;
		this.cancellation = cancellation;
		this.claims = claims;
		this.claimService = claimService;
	}

	@Transactional(readOnly = true)
	public PageResponse<AdminOrderSummary> list(OrderStatus status, LocalDate from, LocalDate to, String q, int page,
			int size) {
		var pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100),
				Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
		String query = blank(q);
		Specification<Order> spec = (root, cq, cb) -> {
			List<Predicate> predicates = new ArrayList<>();
			if (status != null) {
				predicates.add(cb.equal(root.get("status"), status));
			}
			predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), start(from)));
			predicates.add(cb.lessThan(root.get("createdAt"), end(to)));
			if (query != null) {
				String like = "%" + query + "%";
				predicates.add(cb.or(cb.like(root.get("orderNumber"), like), cb.like(root.get("ordererName"), like),
						cb.like(root.get("recipient"), like), cb.like(root.get("ordererPhone"), like),
						cb.like(root.get("recipientPhone"), like)));
			}
			return cb.and(predicates.toArray(Predicate[]::new));
		};
		return PageResponse.of(orders.findAll(spec, pageable), this::summary);
	}

	@Transactional(readOnly = true)
	public AdminOrderDetail detail(String orderNumber) {
		return adminDetail(find(orderNumber));
	}

	/** 허용된 다음 상태로만 바꾼다. 발송은 송장 입력, 취소는 취소 API를 거친다. */
	public AdminOrderDetail changeStatus(String orderNumber, OrderStatus to, String reason, Long adminId) {
		Order order = lock(orderNumber);
		if (!order.getStatus().nextStatuses().contains(to)) {
			throw new ApiException(ErrorCode.ORDER_STATUS_INVALID,
					order.getStatus() + "에서 " + to + "(으)로 바꿀 수 없어요.");
		}
		switch (to) {
			case CANCELLED -> cancellation.cancel(order, adminId, blank(reason) == null ? "관리자 취소" : reason);
			case SHIPPED -> {
				shipments.findByOrderId(order.getId()).filter(s -> s.getCarrier() != null)
						.orElseThrow(() -> new ApiException(ErrorCode.ORDER_STATUS_INVALID, "송장번호를 먼저 입력해주세요."));
				order.changeStatus(OrderStatus.SHIPPED, adminId, blank(reason));
			}
			case DELIVERED -> {
				shipments.findByOrderId(order.getId()).ifPresent(Shipment::markDelivered);
				order.changeStatus(OrderStatus.DELIVERED, adminId, blank(reason));
			}
			default -> order.changeStatus(to, adminId, blank(reason));
		}
		return adminDetail(order);
	}

	/** 송장 입력. 결제 완료·상품 준비 중이면 발송 처리까지, 이미 발송됐으면 송장만 고친다. */
	public AdminOrderDetail ship(String orderNumber, Carrier carrier, String trackingNumber, Long adminId) {
		Order order = lock(orderNumber);
		if (order.getStatus() != OrderStatus.PAID && order.getStatus() != OrderStatus.PREPARING
				&& order.getStatus() != OrderStatus.SHIPPED) {
			throw new ApiException(ErrorCode.ORDER_STATUS_INVALID, "결제 완료 또는 상품 준비 중인 주문만 발송할 수 있어요.");
		}
		Shipment shipment = shipments.findByOrderId(order.getId()).orElseGet(() -> new Shipment(order.getId()));
		shipment.ship(carrier, trackingNumber.trim());
		shipments.save(shipment);
		if (order.getStatus() != OrderStatus.SHIPPED) {
			order.changeStatus(OrderStatus.SHIPPED, adminId, carrier.displayName() + " " + trackingNumber.trim());
		}
		return adminDetail(order);
	}

	public AdminOrderDetail cancel(String orderNumber, String reason, Long adminId) {
		Order order = lock(orderNumber);
		if (!order.getStatus().adminCancellable()) {
			throw new ApiException(ErrorCode.ORDER_NOT_CANCELLABLE);
		}
		cancellation.cancel(order, adminId, blank(reason) == null ? "관리자 취소" : reason.trim());
		return adminDetail(order);
	}

	/** 택배 송장 출력용 CSV (엑셀에서 한글이 깨지지 않도록 UTF-8 BOM). */
	@Transactional(readOnly = true)
	public byte[] exportCsv(LocalDate from, LocalDate to, OrderStatus status) {
		StringBuilder sb = new StringBuilder("﻿");
		sb.append("주문번호,주문일시,상태,주문자,주문자연락처,받는분,연락처,우편번호,주소,상세주소,배송메모,상품명,옵션,수량,결제금액\n");
		for (Order o : orders.findForExport(status, start(from), end(to))) {
			for (var item : o.getItems()) {
				sb.append(csv(o.getOrderNumber())).append(',')
					.append(csv(CSV_TIME.format(o.getCreatedAt()))).append(',')
					.append(csv(o.getStatus().name())).append(',')
					.append(csv(o.getOrdererName())).append(',')
					.append(csv(o.getOrdererPhone())).append(',')
					.append(csv(o.getRecipient())).append(',')
					.append(csv(o.getRecipientPhone())).append(',')
					.append(csv(o.getPostalCode())).append(',')
					.append(csv(o.getAddress1())).append(',')
					.append(csv(o.getAddress2())).append(',')
					.append(csv(o.getDeliveryMemo())).append(',')
					.append(csv(item.getProductName())).append(',')
					.append(csv(item.optionLabel())).append(',')
					.append(item.getQuantity()).append(',')
					.append(o.getTotal()).append('\n');
			}
		}
		return sb.toString().getBytes(StandardCharsets.UTF_8);
	}

	// 반품·교환 --------------------------------------------------------------

	@Transactional(readOnly = true)
	public PageResponse<AdminClaim> claims(ClaimStatus status, int page, int size) {
		var pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100),
				Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
		return PageResponse.of(claims.search(status, pageable), this::adminClaim);
	}

	public AdminClaim processClaim(Long id, ClaimStatus status, Long returnShippingFee, Long refundAmount,
			Long adminId) {
		return adminClaim(claimService.process(id, status, returnShippingFee, refundAmount, adminId));
	}

	// 변환 -----------------------------------------------------------------

	AdminOrderSummary summary(Order o) {
		var s = views.summary(o);
		return new AdminOrderSummary(s.orderNumber(), s.status(), s.orderName(), s.total(), s.itemCount(),
				s.thumbnailUrl(), s.createdAt(), o.getOrdererName(), o.getOrdererPhone(), o.getRecipient());
	}

	private AdminOrderDetail adminDetail(Order o) {
		OrderDetail d = views.detail(o);
		User user = users.findById(o.getUserId()).orElse(null);
		List<AdminPayment> paymentList = payments.findByOrderIdOrderByIdAsc(o.getId()).stream()
				.map(p -> new AdminPayment(p.getId(), p.getProvider().name(), p.getPgPaymentKey(), p.getMethod(),
						p.getStatus().name(), p.getAmount(), p.getCancelledAmount(), p.getApprovedAt(),
						p.getFailureReason()))
				.toList();
		return new AdminOrderDetail(d.orderNumber(), d.status(), d.orderName(), d.total(), d.itemCount(),
				d.thumbnailUrl(), d.createdAt(), d.items(), d.totals(), d.couponCode(), d.shipping(), d.payment(),
				d.shipment(), d.claims(), d.history(), o.getStatus().adminCancellable(), d.paidAt(), d.cancelledAt(),
				user == null ? null : new UserRef(user.getId(), user.getName(), user.getEmail(), user.getPhone()),
				new Orderer(o.getOrdererName(), o.getOrdererEmail(), o.getOrdererPhone()), paymentList,
				o.getStatus().nextStatuses());
	}

	private AdminClaim adminClaim(OrderClaim c) {
		var item = c.getOrderItem();
		var order = item.getOrder();
		return new AdminClaim(c.getId(), item.getId(), c.getType(), c.getReasonType(), c.getReasonDetail(),
				c.getQuantity(), c.getStatus(), c.getReturnShippingFee(), c.getRefundAmount(), c.getCreatedAt(),
				order.getOrderNumber(), item.getProductName(), item.optionLabel(), order.getOrdererName());
	}

	private Order find(String orderNumber) {
		return orders.findByOrderNumber(orderNumber).orElseThrow(() -> new ApiException(ErrorCode.ORDER_NOT_FOUND));
	}

	private Order lock(String orderNumber) {
		return orders.findForUpdate(orderNumber).orElseThrow(() -> new ApiException(ErrorCode.ORDER_NOT_FOUND));
	}

	static Instant start(LocalDate from) {
		return from == null ? Instant.EPOCH : from.atStartOfDay(KST).toInstant();
	}

	static Instant end(LocalDate to) {
		return to == null ? Instant.parse("9999-12-31T00:00:00Z") : to.plusDays(1).atStartOfDay(KST).toInstant();
	}

	private static String csv(String value) {
		if (value == null) {
			return "";
		}
		// 엑셀 수식 주입 방지
		String v = value;
		if (!v.isEmpty() && "=+-@".indexOf(v.charAt(0)) >= 0 && !v.matches("^-?\\d+$")) {
			v = "'" + v;
		}
		return "\"" + v.replace("\"", "\"\"") + "\"";
	}

	private static String blank(String v) {
		return v == null || v.isBlank() ? null : v.trim();
	}
}
