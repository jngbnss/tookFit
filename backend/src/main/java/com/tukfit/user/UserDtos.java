package com.tukfit.user;

import java.time.Instant;
import java.util.List;

import com.tukfit.auth.AuthDtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class UserDtos {

	private UserDtos() {
	}

	public record Me(Long id, String email, String name, String phone, Role role, boolean marketingAgreed,
			boolean hasPassword, List<SocialProvider> socialProviders, Instant createdAt) {

		public static Me of(User user) {
			return new Me(user.getId(), user.getEmail(), user.getName(), user.getPhone(), user.getRole(),
					user.isMarketingAgreed(), user.getPasswordHash() != null,
					user.getSocialAccounts().stream().map(SocialAccount::getProvider).distinct().toList(),
					user.getCreatedAt());
		}
	}

	public record UpdateMeRequest(@Size(min = 1, max = 50) String name,
			@Pattern(regexp = AuthDtos.PHONE_REGEX, message = "연락처 형식이 아니에요.") String phone,
			Boolean marketingAgreed) {
	}

	public record ChangePasswordRequest(String currentPassword,
			@NotBlank @Pattern(regexp = AuthDtos.PASSWORD_REGEX, message = AuthDtos.PASSWORD_MESSAGE) String newPassword) {
	}

	public record AddressDto(Long id, String label, String recipient, String phone, String postalCode,
			String address1, String address2, boolean isDefault) {

		public static AddressDto of(Address a) {
			return new AddressDto(a.getId(), a.getLabel(), a.getRecipient(), a.getPhone(), a.getPostalCode(),
					a.getAddress1(), a.getAddress2(), a.isDefault());
		}
	}

	public record AddressRequest(@Size(max = 30) String label,
			@NotBlank(message = "받는 분을 입력해주세요.") @Size(max = 50) String recipient,
			@NotBlank(message = "연락처를 입력해주세요.") @Pattern(regexp = "^[0-9+\\-]{9,20}$", message = "연락처 형식이 아니에요.") String phone,
			@NotBlank(message = "우편번호를 입력해주세요.") @Size(max = 10) String postalCode,
			@NotBlank(message = "주소를 입력해주세요.") @Size(max = 255) String address1,
			@Size(max = 255) String address2,
			boolean isDefault) {
	}
}
