package com.tukfit.auth;

import java.time.Duration;
import java.util.Optional;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import com.tukfit.global.config.AppProperties;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/** 인증 쿠키(access_token, refresh_token) 읽기·쓰기. */
@Component
public class AuthCookies {

	public static final String ACCESS = "access_token";
	public static final String REFRESH = "refresh_token";
	/** refresh 쿠키는 재발급·로그아웃 경로에만 보낸다. */
	private static final String REFRESH_PATH = "/api/v1/auth";

	private final AppProperties props;

	public AuthCookies(AppProperties props) {
		this.props = props;
	}

	public void write(HttpServletResponse response, String accessToken, String refreshToken) {
		response.addHeader(HttpHeaders.SET_COOKIE,
				cookie(ACCESS, accessToken, "/", props.jwt().accessTtl()).toString());
		response.addHeader(HttpHeaders.SET_COOKIE,
				cookie(REFRESH, refreshToken, REFRESH_PATH, props.jwt().refreshTtl()).toString());
	}

	public void clear(HttpServletResponse response) {
		response.addHeader(HttpHeaders.SET_COOKIE, cookie(ACCESS, "", "/", Duration.ZERO).toString());
		response.addHeader(HttpHeaders.SET_COOKIE, cookie(REFRESH, "", REFRESH_PATH, Duration.ZERO).toString());
	}

	public static Optional<String> read(HttpServletRequest request, String name) {
		Cookie[] cookies = request.getCookies();
		if (cookies == null) {
			return Optional.empty();
		}
		for (Cookie cookie : cookies) {
			if (name.equals(cookie.getName()) && cookie.getValue() != null && !cookie.getValue().isBlank()) {
				return Optional.of(cookie.getValue());
			}
		}
		return Optional.empty();
	}

	private ResponseCookie cookie(String name, String value, String path, Duration maxAge) {
		ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, value)
				.httpOnly(true)
				.secure(props.cookie().secure())
				.sameSite("Lax")
				.path(path)
				.maxAge(maxAge);
		if (props.cookie().domain() != null && !props.cookie().domain().isBlank()) {
			builder.domain(props.cookie().domain());
		}
		return builder.build();
	}
}
