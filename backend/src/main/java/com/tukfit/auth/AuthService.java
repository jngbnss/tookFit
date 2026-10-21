package com.tukfit.auth;

import java.time.Duration;
import java.time.Instant;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tukfit.auth.AuthDtos.LoginRequest;
import com.tukfit.auth.AuthDtos.PasswordResetConfirm;
import com.tukfit.auth.AuthDtos.SignupRequest;
import com.tukfit.global.config.AppProperties;
import com.tukfit.global.error.ApiException;
import com.tukfit.global.error.ErrorCode;
import com.tukfit.user.Role;
import com.tukfit.user.User;
import com.tukfit.user.UserRepository;

@Service
public class AuthService {

	private static final Duration RESET_TTL = Duration.ofMinutes(30);

	private final UserRepository users;
	private final PasswordEncoder passwordEncoder;
	private final TokenService tokens;
	private final PasswordResetTokenRepository resetTokens;
	private final MailService mail;
	private final AppProperties props;

	public AuthService(UserRepository users, PasswordEncoder passwordEncoder, TokenService tokens,
			PasswordResetTokenRepository resetTokens, MailService mail, AppProperties props) {
		this.users = users;
		this.passwordEncoder = passwordEncoder;
		this.tokens = tokens;
		this.resetTokens = resetTokens;
		this.mail = mail;
		this.props = props;
	}

	@Transactional
	public Login signup(SignupRequest request) {
		String email = request.email().trim().toLowerCase();
		if (users.existsByEmailIgnoreCase(email)) {
			throw new ApiException(ErrorCode.EMAIL_DUPLICATED);
		}
		String phone = request.phone() == null || request.phone().isBlank() ? null : request.phone();
		User user = users.save(new User(email, passwordEncoder.encode(request.password()), request.name().trim(), phone,
				Role.USER, request.agreeMarketing()));
		user.recordLogin();
		return new Login(user, tokens.issue(user));
	}

	@Transactional
	public Login login(LoginRequest request) {
		User user = users.findByEmailIgnoreCase(request.email().trim())
				.filter(User::isActive)
				.filter(u -> u.getPasswordHash() != null)
				.filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
				.orElseThrow(() -> new ApiException(ErrorCode.INVALID_CREDENTIALS));
		user.recordLogin();
		return new Login(user, tokens.issue(user));
	}

	/** 가입 여부를 드러내지 않도록 항상 성공한 것처럼 응답한다. */
	@Transactional
	public void requestPasswordReset(String email) {
		users.findByEmailIgnoreCase(email.trim()).filter(User::isActive).ifPresent(user -> {
			String token = Tokens.random();
			resetTokens.save(new PasswordResetToken(user.getId(), Tokens.sha256(token), Instant.now().plus(RESET_TTL)));
			String link = props.frontendUrl() + "/reset-password?token=" + token;
			mail.send(user.getEmail(), "[TUK FIT] 비밀번호 재설정 안내",
					"아래 링크에서 30분 안에 새 비밀번호를 설정해주세요.\n\n" + link
							+ "\n\n요청하지 않았다면 이 메일을 무시해주세요.");
		});
	}

	@Transactional
	public void resetPassword(PasswordResetConfirm request) {
		PasswordResetToken token = resetTokens.findByTokenHash(Tokens.sha256(request.token()))
				.filter(PasswordResetToken::isUsable)
				.orElseThrow(() -> new ApiException(ErrorCode.INVALID_TOKEN));
		User user = users.findById(token.getUserId()).filter(User::isActive)
				.orElseThrow(() -> new ApiException(ErrorCode.INVALID_TOKEN));
		token.use();
		user.changePassword(passwordEncoder.encode(request.newPassword()));
		tokens.revokeAll(user.getId());
	}

	public record Login(User user, TokenService.IssuedTokens tokens) {
	}
}
