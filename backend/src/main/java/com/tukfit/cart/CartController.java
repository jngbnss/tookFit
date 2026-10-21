package com.tukfit.cart;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.tukfit.auth.AuthUser;
import com.tukfit.cart.CartDtos.AddItemRequest;
import com.tukfit.cart.CartDtos.CartDto;
import com.tukfit.cart.CartDtos.MergeRequest;
import com.tukfit.cart.CartDtos.UpdateQuantityRequest;
import com.tukfit.catalog.CatalogDtos.ProductSummary;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/me")
public class CartController {

	private final CartService cart;
	private final WishlistService wishlist;

	public CartController(CartService cart, WishlistService wishlist) {
		this.cart = cart;
		this.wishlist = wishlist;
	}

	@GetMapping("/cart")
	public CartDto cart(@AuthenticationPrincipal AuthUser user) {
		return cart.get(user.id());
	}

	@PostMapping("/cart/items")
	public CartDto add(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody AddItemRequest request) {
		return cart.add(user.id(), request);
	}

	@PatchMapping("/cart/items/{id}")
	public CartDto update(@AuthenticationPrincipal AuthUser user, @PathVariable Long id,
			@Valid @RequestBody UpdateQuantityRequest request) {
		return cart.update(user.id(), id, request.quantity());
	}

	@DeleteMapping("/cart/items/{id}")
	public CartDto remove(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
		return cart.remove(user.id(), id);
	}

	@DeleteMapping("/cart")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void clear(@AuthenticationPrincipal AuthUser user) {
		cart.clear(user.id());
	}

	@PostMapping("/cart/merge")
	public CartDto merge(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody MergeRequest request) {
		return cart.merge(user.id(), request.items());
	}

	@GetMapping("/wishlist")
	public List<ProductSummary> wishlist(@AuthenticationPrincipal AuthUser user) {
		return wishlist.list(user.id());
	}

	@PutMapping("/wishlist/{productId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void addWishlist(@AuthenticationPrincipal AuthUser user, @PathVariable Long productId) {
		wishlist.add(user.id(), productId);
	}

	@DeleteMapping("/wishlist/{productId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void removeWishlist(@AuthenticationPrincipal AuthUser user, @PathVariable Long productId) {
		wishlist.remove(user.id(), productId);
	}
}
