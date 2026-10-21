package com.tukfit.order;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tukfit.cart.CartDtos.CartItemDto;
import com.tukfit.cart.CartLines;
import com.tukfit.catalog.ProductVariant;
import com.tukfit.catalog.ProductVariantRepository;
import com.tukfit.coupon.CouponService;
import com.tukfit.global.error.ApiException;
import com.tukfit.global.error.ErrorCode;
import com.tukfit.global.web.PageResponse;
import com.tukfit.order.OrderDtos.AppliedCoupon;
import com.tukfit.order.OrderDtos.CreateOrderRequest;
import com.tukfit.order.OrderDtos.CreateOrderResponse;
import com.tukfit.order.OrderDtos.Customer;
import com.tukfit.order.OrderDtos.OrderDetail;
import com.tukfit.order.OrderDtos.OrderItemInput;
import com.tukfit.order.OrderDtos.OrderPreview;
import com.tukfit.order.OrderDtos.OrderPreviewRequest;
import com.tukfit.order.OrderDtos.OrderSummary;
import com.tukfit.order.OrderDtos.PaymentInfo;
import com.tukfit.payment.PaymentGateway;
import com.tukfit.payment.PaymentGateways;
import com.tukfit.user.User;
import com.tukfit.user.UserDtos.AddressRequest;
import com.tukfit.user.UserService;

@Service
public class OrderService {

	static final ZoneId KST = ZoneId.of("Asia/Seoul");
	private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyyMMdd");
	private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	private static final SecureRandom RANDOM = new SecureRandom();

	private final OrderRepository orders;
	private final ProductVariantRepository variants;
	private final CartLines cartLines;
	private final PricingService pricing;
	private final CouponService coupons;
	private final UserService users;
	private final PaymentGateways gateways;
	private final OrderViews views;
	private final OrderCancellation cancellation;

	public OrderService(OrderRepository orders, ProductVariantRepository variants, CartLines cartLines,
			PricingService pricing, CouponService coupons, UserService users, PaymentGateways gateways,
			OrderViews views, OrderCancellation cancellation) {
		this.orders = orders;
		this.variants = variants;
		this.cartLines = cartLines;
		this.pricing = pricing;
		this.coupons = coupons;
		this.users = users;
		this.gateways = gateways;
		this.views = views;
		this.cancellation = cancellation;
	}

	/** 주문서 금액 계산. 쿠폰이 맞지 않으면 할인 0으로 계산하고 이유를 함께 돌려준다. */
	@Transactional(readOnly = true)
	public OrderPreview preview(Long userId, OrderPreviewRequest request) {
		List<CartItemDto> lines = lines(request.items());
		long subtotal = lines.stream().filter(CartItemDto::available).mapToLong(CartItemDto::lineTotal).sum();
		int count = lines.stream().filter(CartItemDto::available).mapToInt(CartItemDto::quantity).sum();
		AppliedCoupon applied = null;
		String couponError = null;
		long discount = 0;
		if (request.couponCode() != null && !request.couponCode().isBlank()) {
			try {
				CouponService.Applied a = coupons.apply(request.couponCode(), userId, subtotal);
				discount = a.discount();
				applied = new AppliedCoupon(a.coupon().getCode(), a.coupon().getName(), discount);
			}
			catch (ApiException e) {
				couponError = e.getMessage();
			}
		}
		return new OrderPreview(lines, pricing.totals(subtotal, count, discount), applied, couponError);
	}

	/** 결제 전 주문(PENDING_PAYMENT)을 만든다. 재고는 결제 승인 때 줄인다. */
	@Transactional
	public CreateOrderResponse create(Long userId, CreateOrderRequest request) {
		User user = users.get(userId);
		List<CartItemDto> lines = lines(request.items());
		for (CartItemDto line : lines) {
			if (!line.available()) {
				ErrorCode code = line.stock() < line.quantity() ? ErrorCode.OUT_OF_STOCK : ErrorCode.PRODUCT_UNAVAILABLE;
				throw new ApiException(code, line.productName() + " (" + line.colorName() + " / " + line.size()
						+ ") " + (code == ErrorCode.OUT_OF_STOCK ? "재고가 부족해요." : "상품은 지금 구매할 수 없어요."));
			}
		}
		long subtotal = lines.stream().mapToLong(CartItemDto::lineTotal).sum();
		int count = lines.stream().mapToInt(CartItemDto::quantity).sum();

		CouponService.Applied coupon = null;
		if (request.couponCode() != null && !request.couponCode().isBlank()) {
			coupon = coupons.apply(request.couponCode(), userId, subtotal);
		}
		Totals totals = pricing.totals(subtotal, count, coupon == null ? 0 : coupon.discount());

		var s = request.shipping();
		String orderName = lines.get(0).productName() + (lines.size() > 1 ? " 외 " + (lines.size() - 1) + "건" : "");
		Order order = new Order(newOrderNumber(), userId, truncate(orderName, 150), totals,
				coupon == null ? null : coupon.coupon().getId(), coupon == null ? null : coupon.coupon().getCode(),
				new Order.Recipient(s.recipient().trim(), s.phone(), s.postalCode(), s.address1(), blank(s.address2())),
				blank(request.deliveryMemo()), new Order.Orderer(user.getName(), user.getEmail(), user.getPhone()),
				request.fromCart());

		Map<Long, ProductVariant> byId = variants.findByIdIn(lines.stream().map(CartItemDto::variantId).toList())
				.stream().collect(Collectors.toMap(ProductVariant::getId, Function.identity()));
		for (CartItemDto line : lines) {
			ProductVariant v = byId.get(line.variantId());
			order.addItem(new OrderItem(order, v.getId(), v.getProduct().getId(), v.getProduct().getSlug(),
					v.getProduct().getName(), v.getColor().getName(), v.getSize(), CartLines.imageKey(v),
					line.unitPrice(), line.quantity()));
		}
		orders.save(order);

		if (request.saveAddress()) {
			users.addAddress(userId, new AddressRequest(null, s.recipient(), s.phone(), s.postalCode(), s.address1(),
					s.address2(), false));
		}

		PaymentGateway gateway = gateways.active();
		return new CreateOrderResponse(order.getOrderNumber(), order.getOrderName(), order.getTotal(),
				new Customer(user.getName(), user.getEmail(), user.getPhone()),
				new PaymentInfo(gateway.provider(), gateway.clientKey(), "tukfit_" + userId));
	}

	/** 결제 전·만료 주문은 목록에서 뺀다. */
	@Transactional(readOnly = true)
	public PageResponse<OrderSummary> myOrders(Long userId, int page, int size) {
		var pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 50),
				Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
		var result = orders.findByUserIdAndStatusNot(userId, OrderStatus.EXPIRED, pageable);
		return PageResponse.of(result, views::summary);
	}

	@Transactional(readOnly = true)
	public OrderDetail myOrder(Long userId, String orderNumber) {
		return views.detail(owned(userId, orderNumber));
	}

	/** 고객 취소는 결제 완료(PAID) 상태까지만 가능하다. */
	@Transactional
	public OrderDetail cancelByCustomer(Long userId, String orderNumber) {
		Order order = orders.findForUpdate(orderNumber).filter(o -> o.getUserId().equals(userId))
				.orElseThrow(() -> new ApiException(ErrorCode.ORDER_NOT_FOUND));
		if (order.getStatus() != OrderStatus.PAID) {
			throw new ApiException(ErrorCode.ORDER_NOT_CANCELLABLE,
					order.getStatus() == OrderStatus.PREPARING ? "상품 준비가 시작돼 취소할 수 없어요. 고객센터로 문의해주세요."
							: ErrorCode.ORDER_NOT_CANCELLABLE.message());
		}
		cancellation.cancel(order, userId, "고객 취소");
		return views.detail(order);
	}

	Order owned(Long userId, String orderNumber) {
		return orders.findByOrderNumberAndUserId(orderNumber, userId)
				.orElseThrow(() -> new ApiException(ErrorCode.ORDER_NOT_FOUND));
	}

	/** 요청 상품을 주문서 줄로 바꾼다. 같은 옵션이 여러 번 오면 수량을 합친다. */
	private List<CartItemDto> lines(List<OrderItemInput> inputs) {
		Map<Long, Integer> quantities = new LinkedHashMap<>();
		for (OrderItemInput input : inputs) {
			quantities.merge(input.variantId(), input.quantity(), Integer::sum);
		}
		int max = pricing.maxQuantityPerItem();
		Map<Long, ProductVariant> byId = variants.findByIdIn(quantities.keySet()).stream()
				.collect(Collectors.toMap(ProductVariant::getId, Function.identity()));
		List<CartItemDto> lines = new ArrayList<>();
		quantities.forEach((variantId, quantity) -> {
			ProductVariant variant = byId.get(variantId);
			if (variant == null) {
				throw new ApiException(ErrorCode.VARIANT_NOT_FOUND);
			}
			if (quantity > max) {
				throw new ApiException(ErrorCode.QUANTITY_LIMIT, "한 옵션은 최대 " + max + "개까지 주문할 수 있어요.");
			}
			lines.add(cartLines.line(variantId, variant, quantity));
		});
		return lines;
	}

	private String newOrderNumber() {
		String date = LocalDate.now(KST).format(DATE);
		for (int attempt = 0; attempt < 10; attempt++) {
			StringBuilder code = new StringBuilder(6);
			for (int i = 0; i < 6; i++) {
				code.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
			}
			String number = date + "-" + code;
			if (!orders.existsByOrderNumber(number)) {
				return number;
			}
		}
		throw new IllegalStateException("주문번호 생성 실패");
	}

	private static String blank(String v) {
		return v == null || v.isBlank() ? null : v.trim();
	}

	private static String truncate(String v, int max) {
		return v.length() <= max ? v : v.substring(0, max);
	}
}
