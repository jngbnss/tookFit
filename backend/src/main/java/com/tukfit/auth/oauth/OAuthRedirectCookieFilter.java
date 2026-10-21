package com.tukfit.auth.oauth;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/** 소셜 로그인 시작 시 {@code ?redirect=/mypage}를 짧은 쿠키에 담아 두었다가 성공 후 돌아갈 때 쓴다. */
public class OAuthRedirectCookieFilter extends OncePerRequestFilter {

	public static final String COOKIE = "oauth_redirect";

	private final boolean secure;

	public OAuthRedirectCookieFilter(boolean secure) {
		this.secure = secure;
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		return !request.getRequestURI().startsWith("/oauth2/authorization/");
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		String redirect = request.getParameter("redirect");
		if (isSafeRelativePath(redirect)) {
			response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie
					.from(COOKIE, URLEncoder.encode(redirect, StandardCharsets.UTF_8))
					.httpOnly(true).secure(secure).sameSite("Lax").path("/").maxAge(600).build().toString());
		}
		chain.doFilter(request, response);
	}

	/** 다른 사이트로 보내는 열린 리다이렉트를 막는다. */
	public static boolean isSafeRelativePath(String path) {
		return path != null && path.startsWith("/") && !path.startsWith("//") && !path.contains("\\")
				&& !path.contains("\r") && !path.contains("\n") && path.length() <= 200;
	}
}
