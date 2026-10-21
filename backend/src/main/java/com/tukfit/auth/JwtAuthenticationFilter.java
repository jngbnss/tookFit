package com.tukfit.auth;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * access_token 쿠키를 읽어 인증 정보를 채운다.
 * 토큰이 만료됐으면 요청 속성에 표시만 해두고, 인증이 필요한 경로라면 진입점이 TOKEN_EXPIRED로 응답한다.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	public static final String EXPIRED_ATTRIBUTE = "tukfit.tokenExpired";

	private final JwtService jwtService;

	public JwtAuthenticationFilter(JwtService jwtService) {
		this.jwtService = jwtService;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		AuthCookies.read(request, AuthCookies.ACCESS).ifPresent(token -> {
			try {
				AuthUser user = jwtService.verify(token);
				var authentication = new UsernamePasswordAuthenticationToken(user, null,
						List.of(new SimpleGrantedAuthority("ROLE_" + user.role().name())));
				SecurityContextHolder.getContext().setAuthentication(authentication);
			}
			catch (JwtService.ExpiredTokenException e) {
				request.setAttribute(EXPIRED_ATTRIBUTE, Boolean.TRUE);
			}
			catch (RuntimeException e) {
				// 위조되거나 깨진 토큰은 익명 요청으로 취급한다.
			}
		});
		chain.doFilter(request, response);
	}
}
