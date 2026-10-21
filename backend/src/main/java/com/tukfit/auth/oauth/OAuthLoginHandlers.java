package com.tukfit.auth.oauth;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.tukfit.auth.AuthCookies;
import com.tukfit.auth.TokenService;
import com.tukfit.global.config.AppProperties;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/** 소셜 로그인 성공 시 쿠키를 발급해 프론트로 돌려보내고, 실패하면 로그인 화면으로 보낸다. */
@Component
public class OAuthLoginHandlers implements AuthenticationSuccessHandler, AuthenticationFailureHandler {

	private final TokenService tokens;
	private final AuthCookies cookies;
	private final AppProperties props;

	public OAuthLoginHandlers(TokenService tokens, AuthCookies cookies, AppProperties props) {
		this.tokens = tokens;
		this.cookies = cookies;
		this.props = props;
	}

	@Override
	public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
			Authentication authentication) throws IOException {
		OAuth2User principal = (OAuth2User) authentication.getPrincipal();
		Long userId = ((Number) principal.getAttribute(SocialUserService.USER_ID_ATTRIBUTE)).longValue();
		TokenService.IssuedTokens issued = tokens.issueFor(userId);
		cookies.write(response, issued.accessToken(), issued.refreshToken());

		String redirect = AuthCookies.read(request, OAuthRedirectCookieFilter.COOKIE)
				.map(v -> URLDecoder.decode(v, StandardCharsets.UTF_8))
				.filter(OAuthRedirectCookieFilter::isSafeRelativePath)
				.orElse("/");
		clearRedirectCookie(response);
		invalidateSession(request);
		response.sendRedirect(props.frontendUrl() + redirect);
	}

	@Override
	public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
			AuthenticationException exception) throws IOException {
		clearRedirectCookie(response);
		invalidateSession(request);
		response.sendRedirect(props.frontendUrl() + "/login?error=oauth");
	}

	private void clearRedirectCookie(HttpServletResponse response) {
		response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from(OAuthRedirectCookieFilter.COOKIE, "")
				.httpOnly(true).secure(props.cookie().secure()).sameSite("Lax").path("/").maxAge(0).build().toString());
	}

	/** 세션은 OAuth state 보관용으로만 잠깐 쓴다. */
	private void invalidateSession(HttpServletRequest request) {
		HttpSession session = request.getSession(false);
		if (session != null) {
			session.invalidate();
		}
	}
}
