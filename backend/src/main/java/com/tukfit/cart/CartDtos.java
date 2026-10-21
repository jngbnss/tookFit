package com.tukfit.cart;

import java.util.List;

import com.tukfit.order.Totals;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class CartDtos {

	private CartDtos() {
	}

	/** 장바구니 한 줄. 주문서 미리보기에서도 같은 형태를 쓴다 (그때 id는 variantId). */
	public record CartItemDto(Long id, Long variantId, Long productId, String productSlug, String productName,
			String colorName, String size, String imageUrl, long unitPrice, Long originalPrice, int quantity,
			long lineTotal, int stock, boolean available) {
	}

	public record CartDto(List<CartItemDto> items, Totals totals) {
	}

	public record AddItemRequest(@NotNull Long variantId, @NotNull @Min(1) @Max(99) Integer quantity) {
	}

	public record UpdateQuantityRequest(@NotNull @Min(1) @Max(99) Integer quantity) {
	}

	public record MergeRequest(@NotNull @Size(max = 100) List<@Valid AddItemRequest> items) {
	}
}
