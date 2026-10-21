package com.tukfit.order;

import java.time.Instant;
import java.util.List;

import com.tukfit.cart.CartDtos.CartItemDto;
import com.tukfit.payment.PaymentProvider;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class OrderDtos {

	private OrderDtos() {
	}

	public record OrderItemInput(@NotNull Long variantId, @NotNull @Min(1) @Max(99) Integer quantity) {
	}

	public record OrderPreviewRequest(@NotEmpty @Size(max = 50) List<@Valid OrderItemInput> items,
			@Size(max = 30) String couponCode) {
	}

	public record AppliedCoupon(String code, String name, long discount) {
	}

	public record OrderPreview(List<CartItemDto> items, Totals totals, AppliedCoupon coupon, String couponError) {
	}

	public record ShippingInput(@NotBlank(message = "받는 분을 입력해주세요.") @Size(max = 50) String recipient,
			@NotBlank(message = "연락처를 입력해주세요.") @Pattern(regexp = "^[0-9+\\-]{9,20}$", message = "연락처 형식이 아니에요.") String phone,
			@NotBlank(message = "우편번호를 입력해주세요.") @Size(max = 10) String postalCode,
			@NotBlank(message = "주소를 입력해주세요.") @Size(max = 255) String address1,
			@Size(max = 255) String address2) {
	}

	public record CreateOrderRequest(@NotEmpty @Size(max = 50) List<@Valid OrderItemInput> items,
			@Size(max = 30) String couponCode,
			@NotNull @Valid ShippingInput shipping,
			boolean saveAddress,
			@Size(max = 255) String deliveryMemo,
			boolean fromCart) {
	}

	public record Customer(String name, String email, String phone) {
	}

	public record PaymentInfo(PaymentProvider provider, String clientKey, String customerKey) {
	}

	public record CreateOrderResponse(String orderNumber, String orderName, long amount, Customer customer,
			PaymentInfo payment) {
	}

	public record OrderItemDto(Long id, Long variantId, Long productId, String productSlug, String productName,
			String colorName, String size, String imageUrl, long unitPrice, int quantity, long lineTotal,
			boolean reviewable, boolean reviewed) {
	}

	public record OrderSummary(String orderNumber, OrderStatus status, String orderName, long total, int itemCount,
			String thumbnailUrl, Instant createdAt) {
	}

	public record ShippingDto(String recipient, String phone, String postalCode, String address1, String address2,
			String deliveryMemo) {
	}

	public record PaymentDto(String provider, String method, String status, long amount, long cancelledAmount,
			Instant approvedAt) {
	}

	public record ShipmentDto(String carrier, String carrierName, String trackingNumber, String trackingUrl,
			Instant shippedAt, Instant deliveredAt) {
	}

	public record HistoryDto(OrderStatus fromStatus, OrderStatus toStatus, String reason, Instant createdAt) {
	}

	public record ClaimDto(Long id, Long orderItemId, ClaimType type, ClaimReason reasonType, String reasonDetail,
			int quantity, ClaimStatus status, long returnShippingFee, Long refundAmount, Instant createdAt) {

		public static ClaimDto of(OrderClaim c) {
			return new ClaimDto(c.getId(), c.getOrderItem().getId(), c.getType(), c.getReasonType(),
					c.getReasonDetail(), c.getQuantity(), c.getStatus(), c.getReturnShippingFee(), c.getRefundAmount(),
					c.getCreatedAt());
		}
	}

	public record OrderDetail(String orderNumber, OrderStatus status, String orderName, long total, int itemCount,
			String thumbnailUrl, Instant createdAt, List<OrderItemDto> items, Totals totals, String couponCode,
			ShippingDto shipping, PaymentDto payment, ShipmentDto shipment, List<ClaimDto> claims,
			List<HistoryDto> history, boolean cancellable, Instant paidAt, Instant cancelledAt) {
	}

	public record ClaimRequest(@NotNull Long orderItemId, @NotNull ClaimType type, @NotNull ClaimReason reasonType,
			@Size(max = 1000) String reasonDetail, @NotNull @Min(1) Integer quantity, Long exchangeVariantId) {
	}

	public record PaymentConfirmRequest(@NotBlank String orderNumber, @NotBlank @Size(max = 200) String paymentKey,
			@NotNull @Min(0) Long amount) {
	}

	public record PaymentFailRequest(@NotBlank String orderNumber, @Size(max = 100) String code,
			@Size(max = 500) String message) {
	}
}
