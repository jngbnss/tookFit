package com.tukfit.payment;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.tukfit.auth.AuthUser;
import com.tukfit.order.OrderDtos.OrderDetail;
import com.tukfit.order.OrderDtos.PaymentConfirmRequest;
import com.tukfit.order.OrderDtos.PaymentFailRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

	private final PaymentService payments;

	public PaymentController(PaymentService payments) {
		this.payments = payments;
	}

	@PostMapping("/confirm")
	public OrderDetail confirm(@AuthenticationPrincipal AuthUser user,
			@Valid @RequestBody PaymentConfirmRequest request) {
		return payments.confirm(user.id(), request);
	}

	@PostMapping("/fail")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void fail(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody PaymentFailRequest request) {
		payments.fail(user.id(), request);
	}

	/** PG 웹훅. 처리 중 오류가 나도 200을 돌려줘야 PG가 무한 재시도하지 않는다 — 단, 일시 오류는 재시도 받도록 500. */
	@PostMapping("/webhook/{provider}")
	public ResponseEntity<Void> webhook(@PathVariable String provider, @RequestBody String body) {
		PaymentProvider p;
		try {
			p = PaymentProvider.valueOf(provider.toUpperCase());
		}
		catch (IllegalArgumentException e) {
			return ResponseEntity.notFound().build();
		}
		payments.webhook(p, body);
		return ResponseEntity.ok().build();
	}
}
