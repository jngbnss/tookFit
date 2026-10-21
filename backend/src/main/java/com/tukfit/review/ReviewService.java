package com.tukfit.review;

import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tukfit.catalog.CatalogService;
import com.tukfit.catalog.Product;
import com.tukfit.catalog.ProductRepository;
import com.tukfit.global.error.ApiException;
import com.tukfit.global.error.ErrorCode;
import com.tukfit.global.web.PageResponse;
import com.tukfit.order.OrderItem;
import com.tukfit.order.OrderItemRepository;
import com.tukfit.order.OrderStatus;
import com.tukfit.order.Shipment;
import com.tukfit.order.ShipmentRepository;
import com.tukfit.review.ReviewDtos.MyReview;
import com.tukfit.review.ReviewDtos.ProductReviews;
import com.tukfit.review.ReviewDtos.ReviewDto;
import com.tukfit.review.ReviewDtos.ReviewRequest;
import com.tukfit.review.ReviewDtos.ReviewSummary;
import com.tukfit.review.ReviewDtos.ReviewUpdateRequest;
import com.tukfit.review.ReviewDtos.ReviewableItem;
import com.tukfit.storage.ImageUrls;
import com.tukfit.user.User;
import com.tukfit.user.UserRepository;

@Service
public class ReviewService {

	private final ReviewRepository reviews;
	private final CatalogService catalog;
	private final OrderItemRepository orderItems;
	private final ShipmentRepository shipments;
	private final UserRepository users;
	private final ImageUrls imageUrls;
	private final ProductRepository products;

	public ReviewService(ReviewRepository reviews, CatalogService catalog, OrderItemRepository orderItems,
			ShipmentRepository shipments, UserRepository users, ImageUrls imageUrls, ProductRepository products) {
		this.products = products;
		this.reviews = reviews;
		this.catalog = catalog;
		this.orderItems = orderItems;
		this.shipments = shipments;
		this.users = users;
		this.imageUrls = imageUrls;
	}

	@Transactional(readOnly = true)
	public ProductReviews forProduct(String slug, String sort, int page, int size, Long viewerId) {
		Product product = catalog.findActive(slug);
		Sort order = "rating".equals(sort)
				? Sort.by(Sort.Order.desc("rating"), Sort.Order.desc("createdAt"))
				: Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
		Pageable pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 50), order);
		Page<Review> result = reviews.findByProductIdAndStatus(product.getId(), ReviewStatus.VISIBLE, pageable);

		Map<String, Long> distribution = new LinkedHashMap<>();
		for (int i = 1; i <= 5; i++) {
			distribution.put(String.valueOf(i), 0L);
		}
		long count = 0;
		long sum = 0;
		for (Object[] row : reviews.distribution(product.getId())) {
			int rating = ((Number) row[0]).intValue();
			long n = ((Number) row[1]).longValue();
			distribution.put(String.valueOf(rating), n);
			count += n;
			sum += rating * n;
		}
		double average = count == 0 ? 0 : Math.round(sum * 10.0 / count) / 10.0;
		return new ProductReviews(new ReviewSummary(average, count, distribution),
				toPage(result, viewerId));
	}

	@Transactional(readOnly = true)
	public List<ReviewableItem> reviewable(Long userId) {
		List<OrderItem> items = orderItems.findReviewable(userId);
		Map<Long, Shipment> byOrder = shipments
				.findByOrderIdIn(items.stream().map(i -> i.getOrder().getId()).distinct().toList()).stream()
				.collect(Collectors.toMap(Shipment::getOrderId, s -> s));
		return items.stream().map(i -> {
			Shipment s = byOrder.get(i.getOrder().getId());
			return new ReviewableItem(i.getId(), i.getOrder().getOrderNumber(), i.getProductSlug(),
					i.getProductName(), i.optionLabel(), imageUrls.url(i.getImageKey()),
					s != null && s.getDeliveredAt() != null ? s.getDeliveredAt() : i.getOrder().getUpdatedAt());
		}).toList();
	}

	@Transactional
	public ReviewDto create(Long userId, ReviewRequest request) {
		OrderItem item = orderItems.findOwned(request.orderItemId(), userId)
				.orElseThrow(() -> new ApiException(ErrorCode.REVIEW_NOT_ALLOWED));
		if (item.getOrder().getStatus() != OrderStatus.DELIVERED) {
			throw new ApiException(ErrorCode.REVIEW_NOT_ALLOWED, "배송 완료된 상품만 리뷰를 쓸 수 있어요.");
		}
		if (reviews.existsByOrderItemId(item.getId())) {
			throw new ApiException(ErrorCode.REVIEW_DUPLICATED);
		}
		Review review = new Review(item.getProductId(), userId, item.getId(), item.optionLabel());
		review.update(request.rating(), blank(request.title()), request.body().trim(), request.heightCm(),
				request.fitFeedback());
		return toDto(reviews.save(review), names(List.of(userId)), userId);
	}

	@Transactional
	public ReviewDto update(Long userId, Long id, ReviewUpdateRequest request) {
		Review review = reviews.findByIdAndUserId(id, userId)
				.orElseThrow(() -> new ApiException(ErrorCode.REVIEW_NOT_FOUND));
		review.update(request.rating(), blank(request.title()), request.body().trim(), request.heightCm(),
				request.fitFeedback());
		return toDto(review, names(List.of(userId)), userId);
	}

	@Transactional
	public void delete(Long userId, Long id) {
		Review review = reviews.findByIdAndUserId(id, userId)
				.orElseThrow(() -> new ApiException(ErrorCode.REVIEW_NOT_FOUND));
		reviews.delete(review);
	}

	@Transactional(readOnly = true)
	public PageResponse<MyReview> mine(Long userId, int page, int size) {
		var pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 50),
				Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
		Page<Review> result = reviews.findByUserId(userId, pageable);
		Map<Long, String> names = names(List.of(userId));
		Map<Long, Product> byId = products.findAllById(result.getContent().stream().map(Review::getProductId).toList())
				.stream().collect(Collectors.toMap(Product::getId, p -> p));
		return PageResponse.of(result, r -> {
			ReviewDto d = toDto(r, names, userId);
			Product p = byId.get(r.getProductId());
			return new MyReview(d.id(), d.authorName(), d.rating(), d.title(), d.body(), d.heightCm(), d.fitFeedback(),
					d.option(), d.createdAt(), true, p == null ? null : p.getName(), p == null ? null : p.getSlug());
		});
	}

	public PageResponse<ReviewDto> toPage(Page<Review> page, Long viewerId) {
		Map<Long, String> names = names(page.getContent().stream().map(Review::getUserId).distinct().toList());
		return PageResponse.of(page, r -> toDto(r, names, viewerId));
	}

	public ReviewDto toDto(Review r, Map<Long, String> names, Long viewerId) {
		return new ReviewDto(r.getId(), mask(names.get(r.getUserId())), r.getRating(), r.getTitle(), r.getBody(),
				r.getHeightCm(), r.getFitFeedback(), r.getOptionLabel(), r.getCreatedAt(),
				viewerId != null && viewerId.equals(r.getUserId()));
	}

	public Map<Long, String> names(Collection<Long> userIds) {
		Map<Long, String> names = new HashMap<>();
		users.findAllById(userIds).forEach(u -> names.put(u.getId(), ((User) u).getName()));
		return names;
	}

	/** "김툭핏" → "김**" */
	static String mask(String name) {
		if (name == null || name.isBlank()) {
			return "고객";
		}
		return name.charAt(0) + "*".repeat(Math.max(1, Math.min(name.length() - 1, 4)));
	}

	private static String blank(String v) {
		return v == null || v.isBlank() ? null : v.trim();
	}
}
