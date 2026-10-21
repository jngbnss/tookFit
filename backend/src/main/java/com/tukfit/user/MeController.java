package com.tukfit.user;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.tukfit.auth.AuthCookies;
import com.tukfit.auth.AuthUser;
import com.tukfit.user.UserDtos.AddressDto;
import com.tukfit.user.UserDtos.AddressRequest;
import com.tukfit.user.UserDtos.ChangePasswordRequest;
import com.tukfit.user.UserDtos.Me;
import com.tukfit.user.UserDtos.UpdateMeRequest;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/me")
public class MeController {

	private final UserService userService;
	private final AuthCookies cookies;

	public MeController(UserService userService, AuthCookies cookies) {
		this.userService = userService;
		this.cookies = cookies;
	}

	@GetMapping
	public Me me(@AuthenticationPrincipal AuthUser user) {
		return userService.me(user.id());
	}

	@PatchMapping
	public Me update(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody UpdateMeRequest request) {
		return userService.update(user.id(), request);
	}

	@PatchMapping("/password")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void changePassword(@AuthenticationPrincipal AuthUser user,
			@Valid @RequestBody ChangePasswordRequest request) {
		userService.changePassword(user.id(), request);
	}

	@DeleteMapping
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void withdraw(@AuthenticationPrincipal AuthUser user, HttpServletResponse response) {
		userService.withdraw(user.id());
		cookies.clear(response);
	}

	@GetMapping("/addresses")
	public List<AddressDto> addresses(@AuthenticationPrincipal AuthUser user) {
		return userService.addresses(user.id());
	}

	@PostMapping("/addresses")
	@ResponseStatus(HttpStatus.CREATED)
	public AddressDto addAddress(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody AddressRequest request) {
		return userService.addAddress(user.id(), request);
	}

	@PatchMapping("/addresses/{id}")
	public AddressDto updateAddress(@AuthenticationPrincipal AuthUser user, @PathVariable Long id,
			@Valid @RequestBody AddressRequest request) {
		return userService.updateAddress(user.id(), id, request);
	}

	@DeleteMapping("/addresses/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteAddress(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
		userService.deleteAddress(user.id(), id);
	}
}
