package com.tukfit.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.tukfit.auth.AuthDtos.LoginRequest;
import com.tukfit.auth.AuthDtos.PasswordResetConfirm;
import com.tukfit.auth.AuthDtos.PasswordResetRequest;
import com.tukfit.auth.AuthDtos.SignupRequest;
import com.tukfit.global.error.ApiException;
import com.tukfit.global.error.ErrorCode;
import com.tukfit.user.UserDtos.Me;
import com.tukfit.user.UserService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

	private final AuthService authService;
	private final TokenService tokens;
	private final AuthCookies cookies;
	private final UserService userService;

	public AuthController(AuthService authService, TokenService tokens, AuthCookies cookies, UserService userService) {
		this.authService = authService;
		this.tokens = tokens;
		this.cookies = cookies;
		this.userService = userService;
	}

	/** XSRF-TOKEN 쿠키를 발급받기 위한 호출. 토큰을 읽기만 해도 쿠키가 내려간다. */
	@GetMapping("/csrf")
	public ResponseEntity<Void> csrf(CsrfToken token) {
		token.getToken();
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/signup")
	@ResponseStatus(HttpStatus.CREATED)
	public Me signup(@Valid @RequestBody SignupRequest request, HttpServletResponse response) {
		AuthService.Login login = authService.signup(request);
		cookies.write(response, login.tokens().accessToken(), login.tokens().refreshToken());
		return userService.me(login.user().getId());
	}

	@PostMapping("/login")
	public Me login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
		AuthService.Login login = authService.login(request);
		cookies.write(response, login.tokens().accessToken(), login.tokens().refreshToken());
		return userService.me(login.user().getId());
	}

	@PostMapping("/refresh")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void refresh(HttpServletRequest request, HttpServletResponse response) {
		String refreshToken = AuthCookies.read(request, AuthCookies.REFRESH)
				.orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED));
		try {
			TokenService.IssuedTokens issued = tokens.rotate(refreshToken);
			cookies.write(response, issued.accessToken(), issued.refreshToken());
		}
		catch (ApiException e) {
			cookies.clear(response);
			throw e;
		}
	}

	@PostMapping("/logout")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void logout(HttpServletRequest request, HttpServletResponse response) {
		AuthCookies.read(request, AuthCookies.REFRESH).ifPresent(tokens::revoke);
		cookies.clear(response);
	}

	@PostMapping("/password/reset-request")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void resetRequest(@Valid @RequestBody PasswordResetRequest request) {
		authService.requestPasswordReset(request.email());
	}

	@PostMapping("/password/reset")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void reset(@Valid @RequestBody PasswordResetConfirm request) {
		authService.resetPassword(request);
	}
}
