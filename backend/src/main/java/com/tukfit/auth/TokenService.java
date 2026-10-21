package com.tukfit.auth;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tukfit.global.config.AppProperties;
import com.tukfit.global.error.ApiException;
import com.tukfit.global.error.ErrorCode;
import com.tukfit.user.User;
import com.tukfit.user.UserRepository;

/** access/refresh 토큰 발급, 재발급(rotation), 폐기. */
@Service
public class TokenService {

	private final JwtService jwt;
	private final RefreshTokenRepository refreshTokens;
	private final UserRepository users;
	private final AppProperties props;

	public TokenService(JwtService jwt, RefreshTokenRepository refreshTokens, UserRepository users,
			AppProperties props) {
		this.jwt = jwt;
		this.refreshTokens = refreshTokens;
		this.users = users;
		this.props = props;
	}

	@Transactional
	public IssuedTokens issueFor(Long userId) {
		User user = users.findById(userId).orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED));
		return issue(user);
	}

	@Transactional
	public IssuedTokens issue(User user) {
		String refresh = Tokens.random();
		refreshTokens.save(new RefreshToken(user.getId(), Tokens.sha256(refresh),
				Instant.now().plus(props.jwt().refreshTtl())));
		return new IssuedTokens(jwt.issue(user.getId(), user.getRole()), refresh);
	}

	/**
	 * refresh token을 한 번 쓰면 폐기하고 새로 발급한다.
	 * 이미 폐기된 토큰이 다시 오면 탈취로 보고 그 회원의 토큰을 모두 폐기한다.
	 */
	@Transactional(noRollbackFor = ApiException.class)
	public IssuedTokens rotate(String refreshToken) {
		RefreshToken stored = refreshTokens.findForUpdate(Tokens.sha256(refreshToken))
				.orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED));
		if (stored.getRevokedAt() != null) {
			// 여러 탭이 동시에 재발급하는 경우는 탈취로 보지 않는다.
			if (stored.getRevokedAt().isBefore(Instant.now().minusSeconds(30))) {
				refreshTokens.revokeAll(stored.getUserId(), Instant.now());
			}
			throw new ApiException(ErrorCode.UNAUTHORIZED);
		}
		if (!stored.isUsable()) {
			throw new ApiException(ErrorCode.UNAUTHORIZED);
		}
		stored.revoke();
		User user = users.findById(stored.getUserId()).filter(User::isActive)
				.orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED));
		return issue(user);
	}

	@Transactional
	public void revoke(String refreshToken) {
		refreshTokens.findByTokenHash(Tokens.sha256(refreshToken)).ifPresent(RefreshToken::revoke);
	}

	@Transactional
	public void revokeAll(Long userId) {
		refreshTokens.revokeAll(userId, Instant.now());
	}

	@Scheduled(cron = "0 30 4 * * *", zone = "Asia/Seoul")
	@Transactional
	public void purgeExpired() {
		refreshTokens.deleteExpired(Instant.now().minus(1, ChronoUnit.DAYS));
	}

	public record IssuedTokens(String accessToken, String refreshToken) {
	}
}
