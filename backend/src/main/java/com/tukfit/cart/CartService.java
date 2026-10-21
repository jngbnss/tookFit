package com.tukfit.cart;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tukfit.cart.CartDtos.AddItemRequest;
import com.tukfit.cart.CartDtos.CartDto;
import com.tukfit.cart.CartDtos.CartItemDto;
import com.tukfit.catalog.ProductVariant;
import com.tukfit.catalog.ProductVariantRepository;
import com.tukfit.global.error.ApiException;
import com.tukfit.global.error.ErrorCode;
import com.tukfit.order.PricingService;

@Service
public class CartService {

	private final CartItemRepository items;
	private final ProductVariantRepository variants;
	private final CartLines lines;
	private final PricingService pricing;

	public CartService(CartItemRepository items, ProductVariantRepository variants, CartLines lines,
			PricingService pricing) {
		this.items = items;
		this.variants = variants;
		this.lines = lines;
		this.pricing = pricing;
	}

	@Transactional(readOnly = true)
	public CartDto get(Long userId) {
		List<CartItemDto> dtos = items.findByUserIdOrderByIdDesc(userId).stream()
				.map(i -> lines.line(i.getId(), i.getVariant(), i.getQuantity()))
				.toList();
		long subtotal = 0;
		int count = 0;
		for (CartItemDto dto : dtos) {
			if (dto.available()) {
				subtotal += dto.lineTotal();
				count += dto.quantity();
			}
		}
		return new CartDto(dtos, pricing.totals(subtotal, count, 0));
	}

	/** 같은 옵션이 이미 있으면 수량을 더한다. */
	@Transactional
	public CartDto add(Long userId, AddItemRequest request) {
		ProductVariant variant = sellable(request.variantId());
		CartItem item = items.findByUserIdAndVariantId(userId, variant.getId()).orElse(null);
		int quantity = (item == null ? 0 : item.getQuantity()) + request.quantity();
		check(variant, quantity);
		if (item == null) {
			items.save(new CartItem(userId, variant, quantity));
		}
		else {
			item.changeQuantity(quantity);
		}
		return get(userId);
	}

	@Transactional
	public CartDto update(Long userId, Long itemId, int quantity) {
		CartItem item = items.findByIdAndUserId(itemId, userId)
				.orElseThrow(() -> new ApiException(ErrorCode.CART_ITEM_NOT_FOUND));
		check(item.getVariant(), quantity);
		item.changeQuantity(quantity);
		return get(userId);
	}

	@Transactional
	public CartDto remove(Long userId, Long itemId) {
		CartItem item = items.findByIdAndUserId(itemId, userId)
				.orElseThrow(() -> new ApiException(ErrorCode.CART_ITEM_NOT_FOUND));
		items.delete(item);
		return get(userId);
	}

	@Transactional
	public void clear(Long userId) {
		items.deleteByUserId(userId);
	}

	/** 로그인 직후 비회원 장바구니를 합친다. 담을 수 없는 항목은 조용히 건너뛰고, 수량은 한도·재고에 맞춘다. */
	@Transactional
	public CartDto merge(Long userId, List<AddItemRequest> guestItems) {
		int max = pricing.maxQuantityPerItem();
		for (AddItemRequest guest : guestItems) {
			ProductVariant variant = variants.findById(guest.variantId()).orElse(null);
			if (variant == null || !variant.getProduct().isOnSale() || !variant.isAvailable()) {
				continue;
			}
			CartItem item = items.findByUserIdAndVariantId(userId, variant.getId()).orElse(null);
			int wanted = (item == null ? 0 : item.getQuantity()) + guest.quantity();
			int quantity = Math.min(wanted, Math.min(max, variant.getStock()));
			if (quantity < 1) {
				continue;
			}
			if (item == null) {
				items.save(new CartItem(userId, variant, quantity));
			}
			else {
				item.changeQuantity(quantity);
			}
		}
		items.flush();
		return get(userId);
	}

	private ProductVariant sellable(Long variantId) {
		ProductVariant variant = variants.findById(variantId)
				.orElseThrow(() -> new ApiException(ErrorCode.VARIANT_NOT_FOUND));
		if (!variant.getProduct().isOnSale() || !variant.isActive()) {
			throw new ApiException(ErrorCode.PRODUCT_UNAVAILABLE);
		}
		return variant;
	}

	private void check(ProductVariant variant, int quantity) {
		int max = pricing.maxQuantityPerItem();
		if (quantity > max) {
			throw new ApiException(ErrorCode.QUANTITY_LIMIT, "한 옵션은 최대 " + max + "개까지 담을 수 있어요.");
		}
		if (quantity > variant.getStock()) {
			throw new ApiException(ErrorCode.OUT_OF_STOCK,
					variant.getStock() == 0 ? "품절된 옵션이에요." : "최대 " + variant.getStock() + "개까지 주문할 수 있어요.");
		}
	}
}
