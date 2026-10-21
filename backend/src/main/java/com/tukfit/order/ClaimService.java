package com.tukfit.order;

import java.time.Duration;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tukfit.catalog.Inventory;
import com.tukfit.catalog.ProductVariant;
import com.tukfit.catalog.ProductVariantRepository;
import com.tukfit.display.StoreSettingsService;
import com.tukfit.global.error.ApiException;
import com.tukfit.global.error.ErrorCode;
import com.tukfit.order.OrderDtos.ClaimDto;
import com.tukfit.order.OrderDtos.ClaimRequest;
import com.tukfit.payment.RefundService;

/** 반품·교환: 고객 신청과 관리자 처리. */
@Service
public class ClaimService {

	/** 배송 완료 후 신청 가능 기간 (전자상거래법 7일) */
	static final Duration CLAIM_WINDOW = Duration.ofDays(7);

	private final OrderItemRepository orderItems;
	private final OrderClaimRepository claims;
	private final ShipmentRepository shipments;
	private final ProductVariantRepository variants;
	private final StoreSettingsService settings;
	private final RefundService refunds;
	private final Inventory inventory;
	private final OrderRepository orders;

	public ClaimService(OrderItemRepository orderItems, OrderClaimRepository claims, ShipmentRepository shipments,
			ProductVariantRepository variants, StoreSettingsService settings, RefundService refunds,
			Inventory inventory, OrderRepository orders) {
		this.orderItems = orderItems;
		this.claims = claims;
		this.shipments = shipments;
		this.variants = variants;
		this.settings = settings;
		this.refunds = refunds;
		this.inventory = inventory;
		this.orders = orders;
	}

	@Transactional
	public ClaimDto request(Long userId, String orderNumber, ClaimRequest request) {
		OrderItem item = orderItems.findOwned(request.orderItemId(), userId)
				.filter(i -> i.getOrder().getOrderNumber().equals(orderNumber))
				.orElseThrow(() -> new ApiException(ErrorCode.ORDER_NOT_FOUND));
		Order order = item.getOrder();
		if (order.getStatus() != OrderStatus.DELIVERED) {
			throw new ApiException(ErrorCode.CLAIM_NOT_ALLOWED, "배송 완료된 주문만 반품·교환을 신청할 수 있어요.");
		}
		Instant deliveredAt = shipments.findByOrderId(order.getId()).map(Shipment::getDeliveredAt)
				.orElse(order.getUpdatedAt());
		if (deliveredAt != null && Instant.now().isAfter(deliveredAt.plus(CLAIM_WINDOW))) {
			throw new ApiException(ErrorCode.CLAIM_NOT_ALLOWED, "배송 완료 후 7일이 지나 신청할 수 없어요. 고객센터로 문의해주세요.");
		}
		int remaining = item.getQuantity() - claims.claimedQuantity(item.getId());
		if (request.quantity() > remaining) {
			throw new ApiException(ErrorCode.CLAIM_NOT_ALLOWED,
					remaining <= 0 ? "이미 반품·교환을 신청한 상품이에요." : "최대 " + remaining + "개까지 신청할 수 있어요.");
		}
		Long exchangeVariantId = null;
		if (request.type() == ClaimType.EXCHANGE) {
			if (request.exchangeVariantId() == null) {
				throw new ApiException(ErrorCode.VALIDATION_FAILED, "교환할 옵션을 선택해주세요.");
			}
			ProductVariant target = variants.findById(request.exchangeVariantId())
					.filter(v -> v.getProduct().getId().equals(item.getProductId()) && v.isActive())
					.orElseThrow(() -> new ApiException(ErrorCode.VARIANT_NOT_FOUND, "같은 상품의 옵션으로만 교환할 수 있어요."));
			exchangeVariantId = target.getId();
		}
		long fee = request.reasonType().customerPaysShipping() ? settings.get().getReturnShippingFee() : 0;
		OrderClaim claim = claims.save(new OrderClaim(item, request.type(), request.reasonType(),
				blank(request.reasonDetail()), request.quantity(), fee, exchangeVariantId));
		return ClaimDto.of(claim);
	}

	/**
	 * 관리자 처리. REQUESTED → APPROVED/REJECTED, APPROVED → COMPLETED/REJECTED.
	 * COMPLETED: 반품이면 부분 환불 + 재고 복구, 교환이면 교환 옵션 재고 차감 + 원래 옵션 재고 복구.
	 */
	@Transactional
	public OrderClaim process(Long claimId, ClaimStatus to, Long returnShippingFee, Long refundAmount, Long adminId) {
		OrderClaim claim = claims.findForUpdate(claimId).orElseThrow(() -> new ApiException(ErrorCode.CLAIM_NOT_FOUND));
		ClaimStatus from = claim.getStatus();
		boolean allowed = switch (from) {
			case REQUESTED -> to == ClaimStatus.APPROVED || to == ClaimStatus.REJECTED;
			case APPROVED -> to == ClaimStatus.COMPLETED || to == ClaimStatus.REJECTED;
			default -> false;
		};
		if (!allowed) {
			throw new ApiException(ErrorCode.CLAIM_STATUS_INVALID);
		}
		if (returnShippingFee != null) {
			if (returnShippingFee < 0) {
				throw new ApiException(ErrorCode.VALIDATION_FAILED, "반품 배송비는 0원 이상이어야 해요.");
			}
			claim.setReturnShippingFee(returnShippingFee);
		}
		if (to == ClaimStatus.COMPLETED) {
			complete(claim, refundAmount);
		}
		claim.changeStatus(to);
		return claim;
	}

	private void complete(OrderClaim claim, Long requestedRefund) {
		OrderItem item = claim.getOrderItem();
		Order order = orders.findByIdForUpdate(item.getOrder().getId()).orElseThrow();
		Inventory.Line original = new Inventory.Line(item.getVariantId(), claim.getQuantity(), null);
		if (claim.getType() == ClaimType.RETURN) {
			long amount = requestedRefund != null ? requestedRefund
					: Math.max(0, item.getUnitPrice() * claim.getQuantity() - claim.getReturnShippingFee());
			long refundable = refunds.refundableAmount(order.getId());
			if (amount < 0 || amount > refundable) {
				throw new ApiException(ErrorCode.VALIDATION_FAILED,
						String.format("환불 금액은 0원 이상 %,d원 이하로 입력해주세요.", refundable));
			}
			long refunded = refunds.refund(order.getId(), amount, "반품 환불", "claim-" + claim.getId());
			claim.setRefundAmount(refunded);
			inventory.restore(java.util.List.of(original));
		}
		else {
			ProductVariant target = variants.findById(claim.getExchangeVariantId()).orElseThrow();
			inventory.decrement(java.util.List.of(new Inventory.Line(target.getId(), claim.getQuantity(),
					item.getProductName() + " (" + target.optionLabel() + ")")));
			inventory.restore(java.util.List.of(original));
			claim.setRefundAmount(0L);
		}
	}

	private static String blank(String v) {
		return v == null || v.isBlank() ? null : v.trim();
	}
}
