package com.tukfit.review;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.tukfit.auth.AuthUser;
import com.tukfit.global.web.PageResponse;
import com.tukfit.review.ReviewDtos.ProductReviews;
import com.tukfit.review.ReviewDtos.ReviewDto;
import com.tukfit.review.ReviewDtos.ReviewRequest;
import com.tukfit.review.ReviewDtos.ReviewUpdateRequest;
import com.tukfit.review.ReviewDtos.ReviewableItem;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1")
public class ReviewController {

	private final ReviewService reviews;

	public ReviewController(ReviewService reviews) {
		this.reviews = reviews;
	}

	@GetMapping("/products/{slug}/reviews")
	public ProductReviews productReviews(@PathVariable String slug,
			@RequestParam(defaultValue = "newest") String sort, @RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "10") int size, @AuthenticationPrincipal AuthUser user) {
		return reviews.forProduct(slug, sort, page, size, user == null ? null : user.id());
	}

	@GetMapping("/me/reviewable-items")
	public List<ReviewableItem> reviewable(@AuthenticationPrincipal AuthUser user) {
		return reviews.reviewable(user.id());
	}

	@GetMapping("/me/reviews")
	public PageResponse<ReviewDtos.MyReview> mine(@AuthenticationPrincipal AuthUser user,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
		return reviews.mine(user.id(), page, size);
	}

	@PostMapping("/reviews")
	@ResponseStatus(HttpStatus.CREATED)
	public ReviewDto create(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody ReviewRequest request) {
		return reviews.create(user.id(), request);
	}

	@PatchMapping("/reviews/{id}")
	public ReviewDto update(@AuthenticationPrincipal AuthUser user, @PathVariable Long id,
			@Valid @RequestBody ReviewUpdateRequest request) {
		return reviews.update(user.id(), id, request);
	}

	@DeleteMapping("/reviews/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
		reviews.delete(user.id(), id);
	}
}
