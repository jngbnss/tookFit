package com.tukfit.catalog;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.tukfit.global.error.ApiException;
import com.tukfit.global.error.ErrorCode;

/** 재고 차감·복구. 차감은 조건부 UPDATE라서 동시에 주문이 들어와도 음수가 되지 않는다. */
@Component
public class Inventory {

	private final ProductVariantRepository variants;

	public Inventory(ProductVariantRepository variants) {
		this.variants = variants;
	}

	/** 모두 줄이거나, 하나라도 모자라면 OUT_OF_STOCK (호출한 트랜잭션이 롤백된다). */
	@Transactional(propagation = Propagation.MANDATORY)
	public void decrement(List<Line> lines) {
		// 같은 순서로 잠가야 교착 상태가 생기지 않는다.
		for (Line line : lines.stream().sorted(Comparator.comparing(Line::variantId)).toList()) {
			if (variants.decrementStock(line.variantId(), line.quantity()) == 0) {
				throw new ApiException(ErrorCode.OUT_OF_STOCK,
						(line.label() == null ? "선택한 옵션" : line.label()) + "의 재고가 부족해요.");
			}
		}
	}

	@Transactional(propagation = Propagation.MANDATORY)
	public void restore(List<Line> lines) {
		for (Line line : lines.stream().sorted(Comparator.comparing(Line::variantId)).toList()) {
			variants.incrementStock(line.variantId(), line.quantity());
		}
	}

	public record Line(Long variantId, int quantity, String label) {
	}
}
