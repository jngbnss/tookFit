package com.tukfit.global.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * 서버 환경마다 달라지는 값. 모두 환경변수로 덮어쓸 수 있다 (application.yml 참고).
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
		@DefaultValue("http://localhost:3000") String frontendUrl,
		Jwt jwt,
		Cookie cookie,
		Storage storage,
		Payment payment,
		OAuth oauth,
		Admin admin,
		Mail mail) {

	public record Jwt(String secret,
			@DefaultValue("15m") Duration accessTtl,
			@DefaultValue("14d") Duration refreshTtl) {
	}

	public record Cookie(@DefaultValue("true") boolean secure, String domain) {
	}

	public record Storage(String endpoint,
			@DefaultValue("auto") String region,
			String bucket,
			String accessKey,
			String secretKey,
			String publicBaseUrl,
			@DefaultValue("true") boolean pathStyle) {
	}

	public record Payment(@DefaultValue("MOCK") String provider, Toss toss) {
	}

	public record Toss(String clientKey, String secretKey,
			@DefaultValue("https://api.tosspayments.com") String apiBase) {
	}

	public record OAuth(Client kakao, Client naver) {
	}

	public record Client(String clientId, String clientSecret) {
		public boolean configured() {
			return clientId != null && !clientId.isBlank();
		}
	}

	public record Admin(String email, String password) {
	}

	public record Mail(@DefaultValue("no-reply@tukfit.local") String from) {
	}
}
