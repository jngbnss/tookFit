package com.tukfit.admin;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tukfit.admin.AdminDtos.AdminBanner;
import com.tukfit.admin.AdminDtos.AdminNotice;
import com.tukfit.admin.AdminDtos.AdminOrderSummary;
import com.tukfit.admin.AdminDtos.AdminReview;
import com.tukfit.admin.AdminDtos.AdminUser;
import com.tukfit.admin.AdminDtos.AdminUserDetail;
import com.tukfit.admin.AdminDtos.BannerRequest;
import com.tukfit.admin.AdminDtos.CouponDto;
import com.tukfit.admin.AdminDtos.CouponRequest;
import com.tukfit.admin.AdminDtos.Dashboard;
import com.tukfit.admin.AdminDtos.LowStock;
import com.tukfit.admin.AdminDtos.NoticeRequest;
import com.tukfit.admin.AdminDtos.SalesStat;
import com.tukfit.catalog.Product;
import com.tukfit.catalog.ProductRepository;
import com.tukfit.catalog.ProductVariantRepository;
import com.tukfit.coupon.Coupon;
import com.tukfit.coupon.CouponRepository;
import com.tukfit.display.Banner;
import com.tukfit.display.BannerPosition;
import com.tukfit.display.BannerRepository;
import com.tukfit.display.Notice;
import com.tukfit.display.NoticeRepository;
import com.tukfit.global.error.ApiException;
import com.tukfit.global.error.ErrorCode;
import com.tukfit.global.web.PageResponse;
import com.tukfit.order.ClaimStatus;
import com.tukfit.order.OrderClaimRepository;
import com.tukfit.order.OrderRepository;
import com.tukfit.order.OrderStatus;
import com.tukfit.order.OrderViews;
import com.tukfit.review.Review;
import com.tukfit.review.ReviewDtos.ReviewDto;
import com.tukfit.review.ReviewRepository;
import com.tukfit.review.ReviewService;
import com.tukfit.review.ReviewStatus;
import com.tukfit.storage.ImageUrls;
import com.tukfit.user.Role;
import com.tukfit.user.SocialAccount;
import com.tukfit.user.User;
import com.tukfit.user.UserRepository;

import jakarta.persistence.criteria.Predicate;

@Service
@Transactional
public class AdminContentService {

	private static final ZoneId KST = ZoneId.of("Asia/Seoul");
	private static final int LOW_STOCK_THRESHOLD = 3;

	private final OrderRepository orders;
	private final OrderClaimRepository claims;
	private final ProductVariantRepository variants;
	private final ProductRepository products;
	private final UserRepository users;
	private final ReviewRepository reviews;
	private final ReviewService reviewService;
	private final CouponRepository coupons;
	private final BannerRepository banners;
	private final NoticeRepository notices;
	private final ImageUrls imageUrls;
	private final OrderViews orderViews;
	private final AdminOrderService adminOrders;

	public AdminContentService(OrderRepository orders, OrderClaimRepository claims, ProductVariantRepository variants,
			ProductRepository products, UserRepository users, ReviewRepository reviews, ReviewService reviewService,
			CouponRepository coupons, BannerRepository banners, NoticeRepository notices, ImageUrls imageUrls,
			OrderViews orderViews, AdminOrderService adminOrders) {
		this.orders = orders;
		this.claims = claims;
		this.variants = variants;
		this.products = products;
		this.users = users;
		this.reviews = reviews;
		this.reviewService = reviewService;
		this.coupons = coupons;
		this.banners = banners;
		this.notices = notices;
		this.imageUrls = imageUrls;
		this.orderViews = orderViews;
		this.adminOrders = adminOrders;
	}

	// 대시보드 ---------------------------------------------------------------

	@Transactional(readOnly = true)
	public Dashboard dashboard() {
		LocalDate today = LocalDate.now(KST);
		Instant todayStart = today.atStartOfDay(KST).toInstant();
		Instant weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay(KST)
				.toInstant();
		Instant tomorrow = today.plusDays(1).atStartOfDay(KST).toInstant();

		Map<OrderStatus, Long> statusCounts = new EnumMap<>(OrderStatus.class);
		for (OrderStatus s : OrderStatus.values()) {
			statusCounts.put(s, 0L);
		}
		for (Object[] row : orders.countByStatus()) {
			statusCounts.put((OrderStatus) row[0], ((Number) row[1]).longValue());
		}
		long pendingClaims = claims.countByStatus(ClaimStatus.REQUESTED) + claims.countByStatus(ClaimStatus.APPROVED);
		List<LowStock> lowStock = variants.findLowStock(LOW_STOCK_THRESHOLD, PageRequest.of(0, 10)).stream()
				.map(v -> new LowStock(v.getId(), v.getProduct().getId(), v.getProduct().getName(), v.optionLabel(),
						v.getStock()))
				.toList();
		List<AdminOrderSummary> recent = orders
				.findAll(PageRequest.of(0, 5, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))))
				.getContent().stream().filter(o -> o.getStatus() != OrderStatus.EXPIRED).map(adminOrders::summary)
				.toList();
		return new Dashboard(sales(todayStart, tomorrow), sales(weekStart, tomorrow), statusCounts, pendingClaims,
				lowStock, recent);
	}

	private SalesStat sales(Instant from, Instant to) {
		Object[] row = orders.salesBetween(from, to).get(0);
		return new SalesStat(((Number) row[1]).longValue(), ((Number) row[0]).longValue());
	}

	// 회원 -----------------------------------------------------------------

	@Transactional(readOnly = true)
	public PageResponse<AdminUser> users(String q, Role role, int page, int size) {
		var pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100),
				Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
		String query = q == null || q.isBlank() ? null : q.trim().toLowerCase();
		Specification<User> spec = (root, cq, cb) -> {
			List<Predicate> predicates = new ArrayList<>();
			if (role != null) {
				predicates.add(cb.equal(root.get("role"), role));
			}
			if (query != null) {
				String like = "%" + query + "%";
				predicates.add(cb.or(cb.like(cb.lower(root.get("name")), like), cb.like(cb.lower(root.get("email")), like),
						cb.like(root.get("phone"), like)));
			}
			return cb.and(predicates.toArray(Predicate[]::new));
		};
		return PageResponse.of(users.findAll(spec, pageable), this::adminUser);
	}

	@Transactional(readOnly = true)
	public AdminUserDetail user(Long id) {
		User u = users.findById(id).orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
		AdminUser a = adminUser(u);
		var recent = orders.findByUserIdAndStatusNot(id, OrderStatus.EXPIRED,
				PageRequest.of(0, 10, Sort.by(Sort.Order.desc("createdAt")))).getContent().stream()
				.map(orderViews::summary).toList();
		return new AdminUserDetail(a.id(), a.email(), a.name(), a.phone(), a.role(), a.status(), a.socialProviders(),
				a.orderCount(), a.totalSpent(), a.createdAt(), a.lastLoginAt(), recent);
	}

	private AdminUser adminUser(User u) {
		return new AdminUser(u.getId(), u.getEmail(), u.getName(), u.getPhone(), u.getRole(), u.getStatus(),
				u.getSocialAccounts().stream().map(SocialAccount::getProvider).map(Enum::name).distinct().toList(),
				orders.countPlaced(u.getId()), orders.totalSpent(u.getId()), u.getCreatedAt(), u.getLastLoginAt());
	}

	// 리뷰 -----------------------------------------------------------------

	@Transactional(readOnly = true)
	public PageResponse<AdminReview> reviews(ReviewStatus status, Integer rating, int page, int size) {
		var pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100),
				Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
		var result = reviews.search(status, rating == null ? null : rating.shortValue(), pageable);
		Map<Long, String> names = reviewService
				.names(result.getContent().stream().map(Review::getUserId).distinct().toList());
		Map<Long, Product> productMap = OrderViews.byId(
				products.findAllById(result.getContent().stream().map(Review::getProductId).distinct().toList()),
				Product::getId);
		return PageResponse.of(result, r -> adminReview(r, names, productMap));
	}

	public AdminReview changeReviewStatus(Long id, ReviewStatus status) {
		Review review = reviews.findById(id).orElseThrow(() -> new ApiException(ErrorCode.REVIEW_NOT_FOUND));
		review.changeStatus(status);
		Map<Long, Product> productMap = OrderViews.byId(products.findAllById(List.of(review.getProductId())),
				Product::getId);
		return adminReview(review, reviewService.names(List.of(review.getUserId())), productMap);
	}

	private AdminReview adminReview(Review r, Map<Long, String> names, Map<Long, Product> productMap) {
		ReviewDto d = reviewService.toDto(r, names, null);
		Product p = productMap.get(r.getProductId());
		return new AdminReview(d.id(), d.authorName(), d.rating(), d.title(), d.body(), d.heightCm(),
				d.fitFeedback(), d.option(), d.createdAt(), false, p == null ? null : p.getName(),
				p == null ? null : p.getSlug(), r.getUserId(), r.getStatus());
	}

	// 쿠폰 -----------------------------------------------------------------

	@Transactional(readOnly = true)
	public List<CouponDto> coupons() {
		return coupons.findAll(Sort.by(Sort.Order.desc("id"))).stream().map(this::couponDto).toList();
	}

	public CouponDto createCoupon(CouponRequest r) {
		if (coupons.existsByCodeIgnoreCase(r.code())) {
			throw new ApiException(ErrorCode.CODE_DUPLICATED);
		}
		Coupon coupon = new Coupon();
		applyCoupon(coupon, r);
		return couponDto(coupons.save(coupon));
	}

	public CouponDto updateCoupon(Long id, CouponRequest r) {
		Coupon coupon = coupons.findById(id).orElseThrow(() -> new ApiException(ErrorCode.COUPON_NOT_FOUND));
		if (coupons.existsByCodeIgnoreCaseAndIdNot(r.code(), id)) {
			throw new ApiException(ErrorCode.CODE_DUPLICATED);
		}
		applyCoupon(coupon, r);
		return couponDto(coupon);
	}

	private void applyCoupon(Coupon coupon, CouponRequest r) {
		if (r.discountType() == com.tukfit.coupon.DiscountType.PERCENT && r.discountValue() > 100) {
			throw new ApiException(ErrorCode.VALIDATION_FAILED, "할인율은 100% 이하로 입력해주세요.");
		}
		if (r.startsAt() != null && r.endsAt() != null && !r.endsAt().isAfter(r.startsAt())) {
			throw new ApiException(ErrorCode.VALIDATION_FAILED, "종료일은 시작일보다 뒤여야 해요.");
		}
		coupon.update(r.code().trim().toUpperCase(), r.name().trim(), r.discountType(), r.discountValue(),
				r.maxDiscount(), r.minOrderAmount() == null ? 0 : r.minOrderAmount(), r.startsAt(), r.endsAt(),
				r.usageLimit(), r.perUserLimit() == null ? 1 : r.perUserLimit(), r.active());
	}

	private CouponDto couponDto(Coupon c) {
		return new CouponDto(c.getId(), c.getCode(), c.getName(), c.getDiscountType(), c.getDiscountValue(),
				c.getMaxDiscount(), c.getMinOrderAmount(), c.getStartsAt(), c.getEndsAt(), c.getUsageLimit(),
				c.getPerUserLimit(), c.getUsedCount(), c.isActive());
	}

	// 배너 -----------------------------------------------------------------

	@Transactional(readOnly = true)
	public List<AdminBanner> banners(BannerPosition position) {
		return banners.findAllOrdered(position).stream().map(this::adminBanner).toList();
	}

	public AdminBanner createBanner(BannerRequest r) {
		Banner banner = new Banner();
		applyBanner(banner, r);
		return adminBanner(banners.save(banner));
	}

	public AdminBanner updateBanner(Long id, BannerRequest r) {
		Banner banner = banners.findById(id).orElseThrow(() -> new ApiException(ErrorCode.BANNER_NOT_FOUND));
		applyBanner(banner, r);
		return adminBanner(banner);
	}

	public void deleteBanner(Long id) {
		banners.delete(banners.findById(id).orElseThrow(() -> new ApiException(ErrorCode.BANNER_NOT_FOUND)));
	}

	/** 전달한 순서대로 sortOrder를 0부터 다시 매긴다. */
	public List<AdminBanner> reorderBanners(List<Long> ids) {
		for (int i = 0; i < ids.size(); i++) {
			int order = i;
			banners.findById(ids.get(i)).ifPresent(b -> b.changeSortOrder(order));
		}
		return banners(null);
	}

	private void applyBanner(Banner banner, BannerRequest r) {
		if (r.position() != BannerPosition.TOP_STRIP && blank(r.imageKey()) == null) {
			throw new ApiException(ErrorCode.VALIDATION_FAILED, "배너 이미지를 올려주세요.");
		}
		if (r.startsAt() != null && r.endsAt() != null && !r.endsAt().isAfter(r.startsAt())) {
			throw new ApiException(ErrorCode.VALIDATION_FAILED, "종료일은 시작일보다 뒤여야 해요.");
		}
		banner.update(r.position(), blank(r.title()), blank(r.subtitle()), blank(r.imageKey()),
				blank(r.mobileImageKey()), blank(r.linkUrl()), r.sortOrder(), r.startsAt(), r.endsAt(), r.active());
	}

	private AdminBanner adminBanner(Banner b) {
		return new AdminBanner(b.getId(), b.getPosition(), b.getTitle(), b.getSubtitle(), imageUrls.url(b.getImageKey()),
				imageUrls.url(b.getMobileImageKey()), b.getLinkUrl(), b.getSortOrder(), b.getImageKey(),
				b.getMobileImageKey(), b.getStartsAt(), b.getEndsAt(), b.isActive());
	}

	// 공지 -----------------------------------------------------------------

	@Transactional(readOnly = true)
	public PageResponse<AdminNotice> notices(int page, int size) {
		var pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100),
				Sort.by(Sort.Order.desc("pinned"), Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
		return PageResponse.of(notices.findAll(pageable), this::adminNotice);
	}

	public AdminNotice createNotice(NoticeRequest r) {
		Notice notice = new Notice();
		notice.update(r.title().trim(), r.body(), r.pinned(), r.published());
		return adminNotice(notices.save(notice));
	}

	public AdminNotice updateNotice(Long id, NoticeRequest r) {
		Notice notice = notices.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOTICE_NOT_FOUND));
		notice.update(r.title().trim(), r.body(), r.pinned(), r.published());
		return adminNotice(notice);
	}

	public void deleteNotice(Long id) {
		notices.delete(notices.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOTICE_NOT_FOUND)));
	}

	private AdminNotice adminNotice(Notice n) {
		return new AdminNotice(n.getId(), n.getTitle(), n.getBody(), n.isPinned(), n.getCreatedAt(), n.isPublished(),
				n.getUpdatedAt());
	}

	private static String blank(String v) {
		return v == null || v.isBlank() ? null : v.trim();
	}
}
