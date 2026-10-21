package com.tukfit.payment;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import com.tukfit.cart.CartItemRepository;
import com.tukfit.catalog.Inventory;
import com.tukfit.coupon.CouponRepository;
import com.tukfit.global.error.ApiException;
import com.tukfit.global.error.ErrorCode;
import com.tukfit.order.Order;
import com.tukfit.order.OrderCancellation;
import com.tukfit.order.OrderDtos.OrderDetail;
import com.tukfit.order.OrderDtos.PaymentConfirmRequest;
import com.tukfit.order.OrderDtos.PaymentFailRequest;
import com.tukfit.order.OrderItem;
import com.tukfit.order.OrderRepository;
import com.tukfit.order.OrderStatus;
import com.tukfit.order.OrderViews;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * 결제 승인 흐름.
 * 1) 주문·금액 검증 → 2) PG 승인 → 3) 한 트랜잭션에서 재고 차감·쿠폰 사용·PAID 처리
 * 3)이 실패하면(품절 등) PG 결제를 바로 취소해 돈만 빠져나가는 일이 없게 한다.
 */
@Service
public class PaymentService {

	private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

	private final OrderRepository orders;
	private final PaymentRepository payments;
	private final PaymentGateways gateways;
	private final Inventory inventory;
	private final CouponRepository coupons;
	private final CartItemRepository cartItems;
	private final OrderViews views;
	private final OrderCancellation cancellation;
	private final PaymentWebhookEventRepository webhookEvents;
	private final TransactionTemplate tx;
	private final JsonMapper mapper;

	public PaymentService(OrderRepository orders, PaymentRepository payments, PaymentGateways gateways,
			Inventory inventory, CouponRepository coupons, CartItemRepository cartItems, OrderViews views,
			OrderCancellation cancellation, PaymentWebhookEventRepository webhookEvents, TransactionTemplate tx,
			JsonMapper mapper) {
		this.orders = orders;
		this.payments = payments;
		this.gateways = gateways;
		this.inventory = inventory;
		this.coupons = coupons;
		this.cartItems = cartItems;
		this.views = views;
		this.cancellation = cancellation;
		this.webhookEvents = webhookEvents;
		this.tx = tx;
		this.mapper = mapper;
	}

	public OrderDetail confirm(Long userId, PaymentConfirmRequest request) {
		Order order = orders.findByOrderNumberAndUserId(request.orderNumber(), userId)
				.orElseThrow(() -> new ApiException(ErrorCode.ORDER_NOT_FOUND));

		// 같은 결제로 다시 호출되면(새로고침 등) 결과만 돌려준다.
		if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
			boolean samePayment = payments.findByPgPaymentKey(request.paymentKey())
					.filter(p -> p.getOrderId().equals(order.getId()) && p.getStatus() != PaymentStatus.FAILED)
					.isPresent();
			if (samePayment) {
				return detail(order.getOrderNumber());
			}
			throw new ApiException(order.getStatus() == OrderStatus.EXPIRED ? ErrorCode.ORDER_EXPIRED
					: ErrorCode.ORDER_ALREADY_PAID);
		}
		if (request.amount() != order.getTotal()) {
			throw new ApiException(ErrorCode.PAYMENT_AMOUNT_MISMATCH);
		}

		PaymentGateway gateway = gateways.active();
		PaymentGateway.Result result;
		try {
			result = gateway.confirm(request.paymentKey(), order.getOrderNumber(), order.getTotal());
		}
		catch (PaymentGatewayException e) {
			result = recoverAlreadyProcessed(gateway, request, e);
			if (result == null) {
				recordFailure(order.getId(), gateway.provider(), request.paymentKey(), order.getTotal(),
						e.getCode() + ": " + e.getMessage());
				throw new ApiException(ErrorCode.PAYMENT_FAILED, e.getMessage());
			}
		}
		if (result.status() != PaymentGateway.Status.PAID || result.totalAmount() != order.getTotal()) {
			compensate(gateway, result, order, "결제 검증 실패");
			throw new ApiException(ErrorCode.PAYMENT_AMOUNT_MISMATCH);
		}

		PaymentGateway.Result approved = result;
		try {
			tx.executeWithoutResult(status -> complete(order.getOrderNumber(), gateway.provider(), approved));
		}
		catch (ApiException e) {
			compensate(gateway, approved, order, e.getMessage());
			throw e;
		}
		return detail(order.getOrderNumber());
	}

	public void fail(Long userId, PaymentFailRequest request) {
		Order order = orders.findByOrderNumberAndUserId(request.orderNumber(), userId)
				.orElseThrow(() -> new ApiException(ErrorCode.ORDER_NOT_FOUND));
		if (order.getStatus() == OrderStatus.PENDING_PAYMENT) {
			log.info("결제 실패/취소 order={} code={} message={}", order.getOrderNumber(), request.code(),
					request.message());
		}
	}

	/**
	 * PG 웹훅. 본문은 믿지 않고 PG에서 결제 상태를 다시 조회해 맞춘다. 같은 이벤트는 한 번만 처리한다.
	 */
	public void webhook(PaymentProvider provider, String body) {
		if (provider != PaymentProvider.TOSS) {
			return;
		}
		JsonNode root = mapper.readTree(body);
		JsonNode data = root.path("data");
		String paymentKey = data.path("paymentKey").asString(null);
		if (paymentKey == null) {
			return;
		}
		String eventKey = paymentKey + ":" + data.path("status").asString("") + ":"
				+ root.path("createdAt").asString("");
		Boolean fresh = tx.execute(status -> {
			if (webhookEvents.existsByProviderAndEventKey(provider, eventKey)) {
				return false;
			}
			webhookEvents.save(new PaymentWebhookEvent(provider, eventKey, body));
			return true;
		});
		if (!Boolean.TRUE.equals(fresh)) {
			return;
		}

		PaymentGateway gateway = gateways.get(provider);
		PaymentGateway.Result result = gateway.fetch(paymentKey);
		Order order = orders.findByOrderNumber(result.orderNumber()).orElse(null);
		if (order == null) {
			log.warn("웹훅: 주문을 찾을 수 없음 orderNumber={}", result.orderNumber());
			return;
		}
		switch (result.status()) {
			case PAID -> {
				// 승인 응답을 받지 못한 경우(브라우저 종료 등) 여기서 마무리한다.
				if (order.getStatus() == OrderStatus.PENDING_PAYMENT && result.totalAmount() == order.getTotal()) {
					try {
						tx.executeWithoutResult(status -> complete(order.getOrderNumber(), provider, result));
					}
					catch (ApiException e) {
						compensate(gateway, result, order, e.getMessage());
					}
				}
			}
			case CANCELLED, PARTIAL_CANCELLED -> tx.executeWithoutResult(status -> syncCancel(order, result));
			default -> {
			}
		}
	}

	/** 결제 완료 처리. 반드시 트랜잭션 안에서 부른다. */
	private void complete(String orderNumber, PaymentProvider provider, PaymentGateway.Result result) {
		Order order = orders.findForUpdate(orderNumber).orElseThrow();
		if (order.getStatus() == OrderStatus.PAID) {
			return;
		}
		if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
			throw new ApiException(ErrorCode.ORDER_EXPIRED);
		}
		inventory.decrement(order.getItems().stream()
				.map(i -> new Inventory.Line(i.getVariantId(), i.getQuantity(), i.getProductName() + " (" + i.optionLabel() + ")"))
				.toList());
		if (order.getCouponId() != null && coupons.increaseUsage(order.getCouponId()) == 0) {
			throw new ApiException(ErrorCode.COUPON_INVALID, "쿠폰 사용 가능 수량이 모두 소진됐어요.");
		}
		Payment payment = payments.findByPgPaymentKey(result.paymentKey())
				.orElseGet(() -> new Payment(order.getId(), provider, result.paymentKey(), result.totalAmount()));
		payment.approve(result.method(), result.approvedAt(), result.rawJson());
		payments.save(payment);
		order.changeStatus(OrderStatus.PAID, null, null);
		if (order.isFromCart()) {
			cartItems.deleteByUserIdAndVariantIds(order.getUserId(),
					order.getItems().stream().map(OrderItem::getVariantId).toList());
		}
	}

	/** 승인됐지만 주문을 완료하지 못한 결제를 취소한다. */
	private void compensate(PaymentGateway gateway, PaymentGateway.Result result, Order order, String reason) {
		try {
			PaymentGateway.Result cancelled = gateway.cancel(result.paymentKey(), result.totalAmount(),
					"주문 처리 실패: " + reason, "compensate-" + result.paymentKey());
			tx.executeWithoutResult(status -> {
				Payment payment = payments.findByPgPaymentKey(result.paymentKey()).orElseGet(
						() -> new Payment(order.getId(), gateway.provider(), result.paymentKey(), result.totalAmount()));
				payment.approve(result.method(), result.approvedAt(), result.rawJson());
				payment.applyCancel(cancelled.totalAmount(), reason, cancelled.rawJson());
				payments.save(payment);
			});
		}
		catch (RuntimeException e) {
			log.error("결제 보상 취소 실패 — 수동 환불 필요 order={} paymentKey={}", order.getOrderNumber(),
					result.paymentKey(), e);
		}
	}

	/** 이미 승인된 결제를 다시 승인하려 할 때 PG 상태로 복구한다 (응답 유실 대비). */
	private PaymentGateway.Result recoverAlreadyProcessed(PaymentGateway gateway, PaymentConfirmRequest request,
			PaymentGatewayException e) {
		if (!"ALREADY_PROCESSED_PAYMENT".equals(e.getCode())) {
			return null;
		}
		try {
			PaymentGateway.Result fetched = gateway.fetch(request.paymentKey());
			return fetched.status() == PaymentGateway.Status.PAID
					&& request.orderNumber().equals(fetched.orderNumber()) ? fetched : null;
		}
		catch (PaymentGatewayException ignored) {
			return null;
		}
	}

	private void recordFailure(Long orderId, PaymentProvider provider, String paymentKey, long amount, String reason) {
		tx.executeWithoutResult(status -> {
			// 결제 키는 유일해야 하므로 실패 기록에는 남기지 않는다 (같은 키로 재시도 가능).
			Payment payment = new Payment(orderId, provider, null, amount);
			payment.fail(reason + " (paymentKey=" + paymentKey + ")", null);
			payments.save(payment);
		});
	}

	/** PG 쪽에서 취소된 결제를 주문에 반영한다 (PG 관리자 화면에서 직접 취소한 경우). */
	private void syncCancel(Order order, PaymentGateway.Result result) {
		Order locked = orders.findForUpdate(order.getOrderNumber()).orElseThrow();
		payments.findByPgPaymentKey(result.paymentKey()).ifPresent(p -> {
			if (result.cancelledAmount() > p.getCancelledAmount()) {
				p.applyCancel(result.cancelledAmount(), "PG 취소", result.rawJson());
			}
		});
		if (result.status() == PaymentGateway.Status.CANCELLED && locked.getStatus().adminCancellable()) {
			cancellation.cancel(locked, null, "PG에서 결제 취소됨");
		}
	}

	private OrderDetail detail(String orderNumber) {
		return tx.execute(status -> views.detail(orders.findByOrderNumber(orderNumber).orElseThrow()));
	}
}
