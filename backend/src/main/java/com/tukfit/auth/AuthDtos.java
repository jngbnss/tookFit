package com.tukfit.auth;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

	public static final String PASSWORD_REGEX = "^(?=.*[A-Za-z])(?=.*\\d).{8,64}$";
	public static final String PASSWORD_MESSAGE = "비밀번호는 영문과 숫자를 포함해 8~64자로 입력해주세요.";
	public static final String PHONE_REGEX = "^$|^[0-9+\\-]{9,20}$";

	private AuthDtos() {
	}

	public record SignupRequest(
			@NotBlank(message = "이메일을 입력해주세요.") @Email(message = "이메일 형식이 아니에요.") @Size(max = 255) String email,
			@NotBlank(message = "비밀번호를 입력해주세요.") @Pattern(regexp = PASSWORD_REGEX, message = PASSWORD_MESSAGE) String password,
			@NotBlank(message = "이름을 입력해주세요.") @Size(max = 50) String name,
			@Pattern(regexp = PHONE_REGEX, message = "연락처 형식이 아니에요.") String phone,
			@AssertTrue(message = "이용약관에 동의해주세요.") boolean agreeTerms,
			@AssertTrue(message = "개인정보 처리방침에 동의해주세요.") boolean agreePrivacy,
			boolean agreeMarketing) {
	}

	public record LoginRequest(@NotBlank(message = "이메일을 입력해주세요.") String email,
			@NotBlank(message = "비밀번호를 입력해주세요.") String password) {
	}

	public record PasswordResetRequest(@NotBlank @Email String email) {
	}

	public record PasswordResetConfirm(@NotBlank String token,
			@NotBlank @Pattern(regexp = PASSWORD_REGEX, message = PASSWORD_MESSAGE) String newPassword) {
	}
}
