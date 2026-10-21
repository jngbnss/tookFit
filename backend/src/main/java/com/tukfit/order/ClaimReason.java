package com.tukfit.order;

public enum ClaimReason {
	CHANGE_OF_MIND, SIZE, DEFECT, WRONG_ITEM;

	/** 고객 사정이면 반품 배송비를 고객이 낸다. */
	public boolean customerPaysShipping() {
		return this == CHANGE_OF_MIND || this == SIZE;
	}
}
