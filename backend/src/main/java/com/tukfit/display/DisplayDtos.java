package com.tukfit.display;

import java.time.Instant;
import java.util.List;

import com.tukfit.user.SocialProvider;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class DisplayDtos {

	private DisplayDtos() {
	}

	public record BannerDto(Long id, BannerPosition position, String title, String subtitle, String imageUrl,
			String mobileImageUrl, String linkUrl, int sortOrder) {
	}

	public record NoticeSummary(Long id, String title, boolean pinned, Instant createdAt) {
	}

	public record NoticeDto(Long id, String title, String body, boolean pinned, Instant createdAt) {
	}

	public record Business(String companyName, String ceoName, String registrationNumber, String mailOrderNumber,
			String address, String privacyOfficer) {
	}

	public record StoreSettingsDto(String storeName, long shippingFee, long freeShippingThreshold,
			int maxQuantityPerItem, long returnShippingFee, String csPhone, String csEmail, String csHours,
			Business business, List<SocialProvider> socialProviders, String paymentProvider) {
	}

	/** 관리자 설정 화면용 (소셜·결제 provider는 환경변수로만 바꾼다) */
	public record AdminSettings(@NotBlank @Size(max = 100) String storeName,
			@NotNull @Min(0) Long shippingFee,
			@NotNull @Min(0) Long freeShippingThreshold,
			@NotNull @Min(1) @Max(99) Integer maxQuantityPerItem,
			@NotNull @Min(0) Long returnShippingFee,
			@Size(max = 30) String csPhone, @Size(max = 255) String csEmail, @Size(max = 100) String csHours,
			@Valid @NotNull Business business) {
	}
}
