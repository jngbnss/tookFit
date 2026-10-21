package com.tukfit.review;

import java.time.Instant;
import java.util.Map;

import com.tukfit.global.web.PageResponse;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class ReviewDtos {

	private ReviewDtos() {
	}

	public record ReviewDto(Long id, String authorName, int rating, String title, String body, Integer heightCm,
			FitFeedback fitFeedback, String option, Instant createdAt, boolean mine) {
	}

	/** 내가 쓴 리뷰: 어떤 상품인지 함께 보여준다. */
	public record MyReview(Long id, String authorName, int rating, String title, String body, Integer heightCm,
			FitFeedback fitFeedback, String option, Instant createdAt, boolean mine, String productName,
			String productSlug) {
	}

	public record ReviewSummary(double average, long count, Map<String, Long> distribution) {
	}

	public record ProductReviews(ReviewSummary summary, PageResponse<ReviewDto> page) {
	}

	public record ReviewRequest(@NotNull Long orderItemId, @NotNull @Min(1) @Max(5) Integer rating,
			@Size(max = 100) String title, @NotBlank(message = "내용을 입력해주세요.") @Size(max = 2000) String body,
			@Min(100) @Max(250) Integer heightCm, FitFeedback fitFeedback) {
	}

	public record ReviewUpdateRequest(@NotNull @Min(1) @Max(5) Integer rating, @Size(max = 100) String title,
			@NotBlank(message = "내용을 입력해주세요.") @Size(max = 2000) String body,
			@Min(100) @Max(250) Integer heightCm, FitFeedback fitFeedback) {
	}

	public record ReviewableItem(Long orderItemId, String orderNumber, String productSlug, String productName,
			String option, String imageUrl, Instant deliveredAt) {
	}
}
