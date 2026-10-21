package com.tukfit.admin;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import com.tukfit.catalog.Badge;
import com.tukfit.catalog.CatalogDtos.ImageDto;
import com.tukfit.catalog.ProductStatus;
import com.tukfit.coupon.DiscountType;
import com.tukfit.display.BannerPosition;
import com.tukfit.order.Carrier;
import com.tukfit.order.ClaimReason;
import com.tukfit.order.ClaimStatus;
import com.tukfit.order.ClaimType;
import com.tukfit.order.OrderDtos.ClaimDto;
import com.tukfit.order.OrderDtos.HistoryDto;
import com.tukfit.order.OrderDtos.OrderItemDto;
import com.tukfit.order.OrderDtos.OrderSummary;
import com.tukfit.order.OrderDtos.PaymentDto;
import com.tukfit.order.OrderDtos.ShipmentDto;
import com.tukfit.order.OrderDtos.ShippingDto;
import com.tukfit.order.OrderStatus;
import com.tukfit.order.Totals;
import com.tukfit.review.FitFeedback;
import com.tukfit.review.ReviewStatus;
import com.tukfit.user.Role;
import com.tukfit.user.UserStatus;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AdminDtos {

	public static final String SLUG_REGEX = "^[a-z0-9]+(?:-[a-z0-9]+)*$";
	public static final String SLUG_MESSAGE = "영문 소문자, 숫자, 하이픈(-)만 쓸 수 있어요.";

	private AdminDtos() {
	}

	// 대시보드 ---------------------------------------------------------------

	public record SalesStat(long sales, long orders) {
	}

	public record LowStock(Long variantId, Long productId, String productName, String option, int stock) {
	}

	public record Dashboard(SalesStat today, SalesStat week, Map<OrderStatus, Long> statusCounts,
			long pendingClaims, List<LowStock> lowStock, List<AdminOrderSummary> recentOrders) {
	}

	// 상품 -----------------------------------------------------------------

	public record AdminProductSummary(Long id, String slug, String name, String categoryName, long price,
			Long originalPrice, ProductStatus status, Badge badge, String thumbnailUrl, int totalStock,
			int variantCount, Instant updatedAt) {
	}

	public record AdminColor(Long id, String name, String hex, int sortOrder) {
	}

	public record AdminVariant(Long id, Long colorId, String size, String sku, int stock, boolean available,
			boolean active) {
	}

	public record AdminImage(Long id, String url, String alt, Long colorId, int sortOrder, String storageKey) {

		public static AdminImage of(ImageDto dto, String storageKey) {
			return new AdminImage(dto.id(), dto.url(), dto.alt(), dto.colorId(), dto.sortOrder(), storageKey);
		}
	}

	public record AdminProductDetail(Long id, String slug, String name, Long categoryId, String description,
			long price, Long originalPrice, Badge badge, String material, String fit, List<String> care,
			ProductStatus status, Integer featuredRank, Instant publishedAt, List<AdminColor> colors,
			List<AdminVariant> variants, List<AdminImage> images) {
	}

	public record AdminProductRequest(
			@NotBlank @Size(max = 100) @Pattern(regexp = SLUG_REGEX, message = SLUG_MESSAGE) String slug,
			@NotBlank(message = "상품명을 입력해주세요.") @Size(max = 100) String name,
			@NotNull(message = "카테고리를 선택해주세요.") Long categoryId,
			@Size(max = 5000) String description,
			@NotNull @Min(0) Long price,
			@Min(0) Long originalPrice,
			Badge badge,
			@Size(max = 255) String material,
			@Size(max = 255) String fit,
			List<@Size(max = 200) String> care,
			@NotNull ProductStatus status,
			Integer featuredRank) {
	}

	public record ColorInput(Long id, @NotBlank @Size(max = 30) String name,
			@NotBlank @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "#RRGGBB 형식으로 입력해주세요.") String hex,
			int sortOrder) {
	}

	public record VariantInput(Long id, @NotNull Long colorId, @NotBlank @Size(max = 10) String size,
			@Size(max = 50) String sku, @NotNull @Min(0) Integer stock, boolean active) {
	}

	public record StockRequest(@Min(0) Integer stock, Integer delta) {
	}

	public record ImageInput(Long id, @NotBlank @Size(max = 255) String storageKey, @Size(max = 255) String alt,
			Long colorId, int sortOrder) {
	}

	public record PresignRequest(@NotBlank @Size(max = 200) String filename, @NotBlank String contentType,
			@NotBlank String folder) {
	}

	public record AdminCategory(Long id, String slug, String name, int sortOrder, boolean visible,
			long productCount) {
	}

	public record AdminCategoryRequest(
			@NotBlank @Size(max = 50) @Pattern(regexp = SLUG_REGEX, message = SLUG_MESSAGE) String slug,
			@NotBlank @Size(max = 50) String name, int sortOrder, boolean visible) {
	}

	// 주문 -----------------------------------------------------------------

	public record AdminOrderSummary(String orderNumber, OrderStatus status, String orderName, long total,
			int itemCount, String thumbnailUrl, Instant createdAt, String ordererName, String ordererPhone,
			String recipient) {
	}

	public record UserRef(Long id, String name, String email, String phone) {
	}

	public record Orderer(String name, String email, String phone) {
	}

	public record AdminPayment(Long id, String provider, String pgPaymentKey, String method, String status,
			long amount, long cancelledAmount, Instant approvedAt, String failureReason) {
	}

	public record AdminOrderDetail(String orderNumber, OrderStatus status, String orderName, long total,
			int itemCount, String thumbnailUrl, Instant createdAt, List<OrderItemDto> items, Totals totals,
			String couponCode, ShippingDto shipping, PaymentDto payment, ShipmentDto shipment, List<ClaimDto> claims,
			List<HistoryDto> history, boolean cancellable, Instant paidAt, Instant cancelledAt, UserRef user,
			Orderer orderer, List<AdminPayment> payments, List<OrderStatus> nextStatuses) {
	}

	public record StatusRequest(@NotNull OrderStatus status, @Size(max = 255) String reason) {
	}

	public record ShipmentRequest(@NotNull Carrier carrier,
			@NotBlank @Size(max = 50) @Pattern(regexp = "^[0-9A-Za-z-]+$", message = "송장번호 형식이 아니에요.") String trackingNumber) {
	}

	public record CancelRequest(@Size(max = 255) String reason) {
	}

	public record AdminClaim(Long id, Long orderItemId, ClaimType type, ClaimReason reasonType, String reasonDetail,
			int quantity, ClaimStatus status, long returnShippingFee, Long refundAmount, Instant createdAt,
			String orderNumber, String productName, String option, String customerName) {
	}

	public record ClaimProcessRequest(@NotNull ClaimStatus status, @Min(0) Long returnShippingFee,
			@Min(0) Long refundAmount) {
	}

	// 회원, 리뷰 -------------------------------------------------------------

	public record AdminUser(Long id, String email, String name, String phone, Role role, UserStatus status,
			List<String> socialProviders, long orderCount, long totalSpent, Instant createdAt, Instant lastLoginAt) {
	}

	public record AdminUserDetail(Long id, String email, String name, String phone, Role role, UserStatus status,
			List<String> socialProviders, long orderCount, long totalSpent, Instant createdAt, Instant lastLoginAt,
			List<OrderSummary> recentOrders) {
	}

	public record AdminReview(Long id, String authorName, int rating, String title, String body, Integer heightCm,
			FitFeedback fitFeedback, String option, Instant createdAt, boolean mine, String productName,
			String productSlug, Long userId, ReviewStatus status) {
	}

	public record ReviewStatusRequest(@NotNull ReviewStatus status) {
	}

	// 쿠폰, 배너, 공지 ----------------------------------------------------------

	public record CouponDto(Long id, String code, String name, DiscountType discountType, long discountValue,
			Long maxDiscount, long minOrderAmount, Instant startsAt, Instant endsAt, Integer usageLimit,
			int perUserLimit, int usedCount, boolean active) {
	}

	public record CouponRequest(
			@NotBlank @Size(max = 30) @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "영문, 숫자, -, _만 쓸 수 있어요.") String code,
			@NotBlank @Size(max = 100) String name, @NotNull DiscountType discountType,
			@NotNull @Min(1) Long discountValue, @Min(0) Long maxDiscount, @Min(0) Long minOrderAmount,
			Instant startsAt, Instant endsAt, @Min(1) Integer usageLimit, @Min(1) @Max(100) Integer perUserLimit,
			boolean active) {
	}

	public record AdminBanner(Long id, BannerPosition position, String title, String subtitle, String imageUrl,
			String mobileImageUrl, String linkUrl, int sortOrder, String imageKey, String mobileImageKey,
			Instant startsAt, Instant endsAt, boolean active) {
	}

	public record BannerRequest(@NotNull BannerPosition position, @Size(max = 100) String title,
			@Size(max = 100) String subtitle, @Size(max = 255) String linkUrl, int sortOrder,
			@Size(max = 255) String imageKey, @Size(max = 255) String mobileImageKey, Instant startsAt,
			Instant endsAt, boolean active) {
	}

	public record AdminNotice(Long id, String title, String body, boolean pinned, Instant createdAt,
			boolean published, Instant updatedAt) {
	}

	public record NoticeRequest(@NotBlank @Size(max = 200) String title, @NotBlank @Size(max = 20000) String body,
			boolean pinned, boolean published) {
	}
}
