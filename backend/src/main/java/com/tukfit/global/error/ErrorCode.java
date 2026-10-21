package com.tukfit.global.error;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
	VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "입력값을 확인해주세요."),
	BAD_REQUEST(HttpStatus.BAD_REQUEST, "잘못된 요청이에요."),
	UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인이 필요해요."),
	TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "로그인이 만료됐어요."),
	INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 맞지 않아요."),
	INVALID_TOKEN(HttpStatus.BAD_REQUEST, "링크가 만료됐거나 올바르지 않아요."),
	FORBIDDEN(HttpStatus.FORBIDDEN, "권한이 없어요."),
	CSRF_INVALID(HttpStatus.FORBIDDEN, "보안 토큰이 맞지 않아요. 새로고침 후 다시 시도해주세요."),
	NOT_FOUND(HttpStatus.NOT_FOUND, "찾을 수 없어요."),
	USER_NOT_FOUND(HttpStatus.NOT_FOUND, "회원을 찾을 수 없어요."),
	PRODUCT_NOT_FOUND(HttpStatus.NOT_FOUND, "상품을 찾을 수 없어요."),
	VARIANT_NOT_FOUND(HttpStatus.NOT_FOUND, "선택한 옵션을 찾을 수 없어요."),
	CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "카테고리를 찾을 수 없어요."),
	ORDER_NOT_FOUND(HttpStatus.NOT_FOUND, "주문을 찾을 수 없어요."),
	REVIEW_NOT_FOUND(HttpStatus.NOT_FOUND, "리뷰를 찾을 수 없어요."),
	ADDRESS_NOT_FOUND(HttpStatus.NOT_FOUND, "배송지를 찾을 수 없어요."),
	CART_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "장바구니 상품을 찾을 수 없어요."),
	CLAIM_NOT_FOUND(HttpStatus.NOT_FOUND, "반품·교환 요청을 찾을 수 없어요."),
	COUPON_NOT_FOUND(HttpStatus.NOT_FOUND, "쿠폰을 찾을 수 없어요."),
	BANNER_NOT_FOUND(HttpStatus.NOT_FOUND, "배너를 찾을 수 없어요."),
	NOTICE_NOT_FOUND(HttpStatus.NOT_FOUND, "공지를 찾을 수 없어요."),
	EMAIL_DUPLICATED(HttpStatus.CONFLICT, "이미 가입된 이메일이에요."),
	SLUG_DUPLICATED(HttpStatus.CONFLICT, "이미 사용 중인 주소(slug)예요."),
	CODE_DUPLICATED(HttpStatus.CONFLICT, "이미 사용 중인 코드예요."),
	OUT_OF_STOCK(HttpStatus.CONFLICT, "선택한 옵션의 재고가 부족해요."),
	QUANTITY_LIMIT(HttpStatus.CONFLICT, "한 옵션은 최대 5개까지 담을 수 있어요."),
	PRODUCT_UNAVAILABLE(HttpStatus.CONFLICT, "판매하지 않는 상품이에요."),
	COUPON_INVALID(HttpStatus.CONFLICT, "사용할 수 없는 쿠폰이에요."),
	ORDER_NOT_CANCELLABLE(HttpStatus.CONFLICT, "취소할 수 없는 주문 상태예요."),
	ORDER_STATUS_INVALID(HttpStatus.CONFLICT, "변경할 수 없는 주문 상태예요."),
	ORDER_ALREADY_PAID(HttpStatus.CONFLICT, "이미 결제된 주문이에요."),
	ORDER_EXPIRED(HttpStatus.CONFLICT, "결제 기한이 지난 주문이에요."),
	CLAIM_NOT_ALLOWED(HttpStatus.CONFLICT, "반품·교환을 신청할 수 없는 상품이에요."),
	CLAIM_STATUS_INVALID(HttpStatus.CONFLICT, "변경할 수 없는 반품·교환 상태예요."),
	REVIEW_NOT_ALLOWED(HttpStatus.CONFLICT, "리뷰를 쓸 수 없는 상품이에요."),
	REVIEW_DUPLICATED(HttpStatus.CONFLICT, "이미 리뷰를 작성했어요."),
	WITHDRAW_NOT_ALLOWED(HttpStatus.CONFLICT, "진행 중인 주문이 있어 탈퇴할 수 없어요."),
	IN_USE(HttpStatus.CONFLICT, "사용 중이라 삭제할 수 없어요."),
	PASSWORD_MISMATCH(HttpStatus.BAD_REQUEST, "현재 비밀번호가 맞지 않아요."),
	PAYMENT_AMOUNT_MISMATCH(HttpStatus.UNPROCESSABLE_CONTENT, "결제 금액이 주문 금액과 달라요."),
	PAYMENT_FAILED(HttpStatus.UNPROCESSABLE_CONTENT, "결제를 완료하지 못했어요."),
	STORAGE_NOT_CONFIGURED(HttpStatus.SERVICE_UNAVAILABLE, "이미지 저장소가 설정되지 않았어요."),
	INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.");

	private final HttpStatus status;
	private final String message;

	ErrorCode(HttpStatus status, String message) {
		this.status = status;
		this.message = message;
	}

	public HttpStatus status() {
		return status;
	}

	public String message() {
		return message;
	}
}
