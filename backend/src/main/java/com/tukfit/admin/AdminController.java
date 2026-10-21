package com.tukfit.admin;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.tukfit.admin.AdminDtos.AdminBanner;
import com.tukfit.admin.AdminDtos.AdminClaim;
import com.tukfit.admin.AdminDtos.AdminNotice;
import com.tukfit.admin.AdminDtos.AdminOrderDetail;
import com.tukfit.admin.AdminDtos.AdminOrderSummary;
import com.tukfit.admin.AdminDtos.AdminReview;
import com.tukfit.admin.AdminDtos.AdminUser;
import com.tukfit.admin.AdminDtos.AdminUserDetail;
import com.tukfit.admin.AdminDtos.BannerRequest;
import com.tukfit.admin.AdminDtos.CancelRequest;
import com.tukfit.admin.AdminDtos.ClaimProcessRequest;
import com.tukfit.admin.AdminDtos.CouponDto;
import com.tukfit.admin.AdminDtos.CouponRequest;
import com.tukfit.admin.AdminDtos.Dashboard;
import com.tukfit.admin.AdminDtos.NoticeRequest;
import com.tukfit.admin.AdminDtos.ReviewStatusRequest;
import com.tukfit.admin.AdminDtos.ShipmentRequest;
import com.tukfit.admin.AdminDtos.StatusRequest;
import com.tukfit.auth.AuthUser;
import com.tukfit.display.BannerPosition;
import com.tukfit.display.DisplayDtos.AdminSettings;
import com.tukfit.display.StoreSettingsService;
import com.tukfit.global.web.PageResponse;
import com.tukfit.order.ClaimStatus;
import com.tukfit.order.OrderStatus;
import com.tukfit.review.ReviewStatus;
import com.tukfit.user.Role;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

	private final AdminOrderService orders;
	private final AdminContentService content;
	private final StoreSettingsService settings;

	public AdminController(AdminOrderService orders, AdminContentService content, StoreSettingsService settings) {
		this.orders = orders;
		this.content = content;
		this.settings = settings;
	}

	@GetMapping("/dashboard")
	public Dashboard dashboard() {
		return content.dashboard();
	}

	// 주문 -----------------------------------------------------------------

	@GetMapping("/orders")
	public PageResponse<AdminOrderSummary> orders(@RequestParam(required = false) OrderStatus status,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
			@RequestParam(required = false) String q, @RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {
		return orders.list(status, from, to, q, page, size);
	}

	@GetMapping("/orders/export")
	public ResponseEntity<byte[]> export(
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
			@RequestParam(required = false) OrderStatus status) {
		String filename = "orders-" + (from == null ? "all" : from) + "-" + (to == null ? "all" : to) + ".csv";
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
				.contentType(new MediaType("text", "csv", java.nio.charset.StandardCharsets.UTF_8))
				.body(orders.exportCsv(from, to, status));
	}

	@GetMapping("/orders/{orderNumber}")
	public AdminOrderDetail order(@PathVariable String orderNumber) {
		return orders.detail(orderNumber);
	}

	@PatchMapping("/orders/{orderNumber}/status")
	public AdminOrderDetail status(@PathVariable String orderNumber, @Valid @RequestBody StatusRequest request,
			@AuthenticationPrincipal AuthUser admin) {
		return orders.changeStatus(orderNumber, request.status(), request.reason(), admin.id());
	}

	@PostMapping("/orders/{orderNumber}/shipment")
	public AdminOrderDetail shipment(@PathVariable String orderNumber, @Valid @RequestBody ShipmentRequest request,
			@AuthenticationPrincipal AuthUser admin) {
		return orders.ship(orderNumber, request.carrier(), request.trackingNumber(), admin.id());
	}

	@PostMapping("/orders/{orderNumber}/cancel")
	public AdminOrderDetail cancel(@PathVariable String orderNumber, @Valid @RequestBody(required = false) CancelRequest request,
			@AuthenticationPrincipal AuthUser admin) {
		return orders.cancel(orderNumber, request == null ? null : request.reason(), admin.id());
	}

	@GetMapping("/claims")
	public PageResponse<AdminClaim> claims(@RequestParam(required = false) ClaimStatus status,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
		return orders.claims(status, page, size);
	}

	@PatchMapping("/claims/{id}")
	public AdminClaim claim(@PathVariable Long id, @Valid @RequestBody ClaimProcessRequest request,
			@AuthenticationPrincipal AuthUser admin) {
		return orders.processClaim(id, request.status(), request.returnShippingFee(), request.refundAmount(),
				admin.id());
	}

	// 회원, 리뷰 -------------------------------------------------------------

	@GetMapping("/users")
	public PageResponse<AdminUser> users(@RequestParam(required = false) String q,
			@RequestParam(required = false) Role role, @RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {
		return content.users(q, role, page, size);
	}

	@GetMapping("/users/{id}")
	public AdminUserDetail user(@PathVariable Long id) {
		return content.user(id);
	}

	@GetMapping("/reviews")
	public PageResponse<AdminReview> reviews(@RequestParam(required = false) ReviewStatus status,
			@RequestParam(required = false) Integer rating, @RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {
		return content.reviews(status, rating, page, size);
	}

	@PatchMapping("/reviews/{id}")
	public AdminReview review(@PathVariable Long id, @Valid @RequestBody ReviewStatusRequest request) {
		return content.changeReviewStatus(id, request.status());
	}

	// 쿠폰, 배너, 공지, 설정 ------------------------------------------------------

	@GetMapping("/coupons")
	public List<CouponDto> coupons() {
		return content.coupons();
	}

	@PostMapping("/coupons")
	@ResponseStatus(HttpStatus.CREATED)
	public CouponDto createCoupon(@Valid @RequestBody CouponRequest request) {
		return content.createCoupon(request);
	}

	@PatchMapping("/coupons/{id}")
	public CouponDto updateCoupon(@PathVariable Long id, @Valid @RequestBody CouponRequest request) {
		return content.updateCoupon(id, request);
	}

	@GetMapping("/banners")
	public List<AdminBanner> banners(@RequestParam(required = false) BannerPosition position) {
		return content.banners(position);
	}

	@PostMapping("/banners")
	@ResponseStatus(HttpStatus.CREATED)
	public AdminBanner createBanner(@Valid @RequestBody BannerRequest request) {
		return content.createBanner(request);
	}

	@PutMapping("/banners/order")
	public List<AdminBanner> reorderBanners(@RequestBody List<Long> ids) {
		return content.reorderBanners(ids);
	}

	@PatchMapping("/banners/{id}")
	public AdminBanner updateBanner(@PathVariable Long id, @Valid @RequestBody BannerRequest request) {
		return content.updateBanner(id, request);
	}

	@DeleteMapping("/banners/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteBanner(@PathVariable Long id) {
		content.deleteBanner(id);
	}

	@GetMapping("/notices")
	public PageResponse<AdminNotice> notices(@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {
		return content.notices(page, size);
	}

	@PostMapping("/notices")
	@ResponseStatus(HttpStatus.CREATED)
	public AdminNotice createNotice(@Valid @RequestBody NoticeRequest request) {
		return content.createNotice(request);
	}

	@PatchMapping("/notices/{id}")
	public AdminNotice updateNotice(@PathVariable Long id, @Valid @RequestBody NoticeRequest request) {
		return content.updateNotice(id, request);
	}

	@DeleteMapping("/notices/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteNotice(@PathVariable Long id) {
		content.deleteNotice(id);
	}

	@GetMapping("/settings")
	public AdminSettings settings() {
		return settings.adminSettings();
	}

	@PutMapping("/settings")
	public AdminSettings updateSettings(@Valid @RequestBody AdminSettings request) {
		return settings.update(request);
	}
}
