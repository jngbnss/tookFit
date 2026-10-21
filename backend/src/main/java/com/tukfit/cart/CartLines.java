package com.tukfit.cart;

import java.util.List;

import org.springframework.stereotype.Component;

import com.tukfit.cart.CartDtos.CartItemDto;
import com.tukfit.catalog.Product;
import com.tukfit.catalog.ProductImage;
import com.tukfit.catalog.ProductVariant;
import com.tukfit.storage.ImageUrls;

/** 옵션(variant)과 수량으로 장바구니·주문서 한 줄을 만든다. */
@Component
public class CartLines {

	private final ImageUrls imageUrls;

	public CartLines(ImageUrls imageUrls) {
		this.imageUrls = imageUrls;
	}

	public CartItemDto line(Long id, ProductVariant variant, int quantity) {
		Product product = variant.getProduct();
		boolean available = product.isOnSale() && variant.isAvailable() && variant.getStock() >= quantity;
		return new CartItemDto(id, variant.getId(), product.getId(), product.getSlug(), product.getName(),
				variant.getColor().getName(), variant.getSize(), imageUrls.url(imageKey(variant)), product.getPrice(),
				product.getOriginalPrice(), quantity, product.getPrice() * quantity, variant.getStock(), available);
	}

	/** 해당 색상의 대표 사진, 없으면 상품 대표 사진 */
	public static String imageKey(ProductVariant variant) {
		List<ProductImage> images = variant.getProduct().getImages();
		return images.stream()
				.filter(i -> i.getColor() != null && i.getColor().getId().equals(variant.getColor().getId()))
				.findFirst()
				.or(() -> images.stream().findFirst())
				.map(ProductImage::getStorageKey)
				.orElse(null);
	}
}
