package com.tukfit.order;

import org.springframework.stereotype.Service;

import com.tukfit.display.StoreSettings;
import com.tukfit.display.StoreSettingsService;

/**
 * subtotal     = Σ(단가 × 수량)
 * discount     = 쿠폰 할인 (상품 금액 기준)
 * shippingFee  = subtotal >= 무료배송 기준 ? 0 : 기본 배송비 (상품이 없으면 0)
 * total        = subtotal - discount + shippingFee
 */
@Service
public class PricingService {

	private final StoreSettingsService settings;

	public PricingService(StoreSettingsService settings) {
		this.settings = settings;
	}

	public Totals totals(long subtotal, int itemCount, long discount) {
		StoreSettings s = settings.get();
		long threshold = s.getFreeShippingThreshold();
		long shipping = subtotal <= 0 || subtotal >= threshold ? 0 : s.getShippingFee();
		long safeDiscount = Math.min(Math.max(discount, 0), subtotal);
		long remaining = subtotal >= threshold ? 0 : threshold - subtotal;
		return new Totals(subtotal, safeDiscount, shipping, subtotal - safeDiscount + shipping, itemCount, remaining);
	}

	public int maxQuantityPerItem() {
		return settings.get().getMaxQuantityPerItem();
	}
}
