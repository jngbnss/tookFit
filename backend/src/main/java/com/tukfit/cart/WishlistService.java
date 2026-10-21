package com.tukfit.cart;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tukfit.catalog.CatalogDtos.ProductSummary;
import com.tukfit.catalog.Product;
import com.tukfit.catalog.ProductMapper;
import com.tukfit.catalog.ProductRepository;
import com.tukfit.global.error.ApiException;
import com.tukfit.global.error.ErrorCode;

@Service
public class WishlistService {

	private final WishlistRepository wishlists;
	private final ProductRepository products;
	private final ProductMapper mapper;

	public WishlistService(WishlistRepository wishlists, ProductRepository products, ProductMapper mapper) {
		this.wishlists = wishlists;
		this.products = products;
		this.mapper = mapper;
	}

	/** 판매 중인 상품만 최근에 담은 순으로 */
	@Transactional(readOnly = true)
	public List<ProductSummary> list(Long userId) {
		List<Long> ids = wishlists.findByUserIdOrderByIdDesc(userId).stream().map(Wishlist::getProductId).toList();
		Map<Long, Product> byId = products.findAllById(ids).stream()
				.collect(Collectors.toMap(Product::getId, Function.identity()));
		List<Product> ordered = ids.stream().map(byId::get).filter(p -> p != null && p.isOnSale()).toList();
		return mapper.summaries(ordered);
	}

	@Transactional
	public void add(Long userId, Long productId) {
		if (!products.existsById(productId)) {
			throw new ApiException(ErrorCode.PRODUCT_NOT_FOUND);
		}
		if (wishlists.existsByUserIdAndProductId(userId, productId)) {
			return;
		}
		wishlists.save(new Wishlist(userId, productId));
	}

	@Transactional
	public void remove(Long userId, Long productId) {
		wishlists.deleteByUserIdAndProductId(userId, productId);
	}
}
