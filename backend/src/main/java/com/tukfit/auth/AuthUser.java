package com.tukfit.auth;

import com.tukfit.user.Role;

/** 인증된 요청의 사용자. 컨트롤러에서 {@code @AuthenticationPrincipal AuthUser}로 받는다. */
public record AuthUser(Long id, Role role) {

	public boolean isAdmin() {
		return role == Role.ADMIN;
	}
}
