package com.tukfit.order;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.tukfit.auth.AuthUser;
import com.tukfit.global.web.PageResponse;
import com.tukfit.order.OrderDtos.ClaimDto;
import com.tukfit.order.OrderDtos.ClaimRequest;
import com.tukfit.order.OrderDtos.CreateOrderRequest;
import com.tukfit.order.OrderDtos.CreateOrderResponse;
import com.tukfit.order.OrderDtos.OrderDetail;
import com.tukfit.order.OrderDtos.OrderPreview;
import com.tukfit.order.OrderDtos.OrderPreviewRequest;
import com.tukfit.order.OrderDtos.OrderSummary;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1")
public class OrderController {

	private final OrderService orders;
	private final ClaimService claims;

	public OrderController(OrderService orders, ClaimService claims) {
		this.orders = orders;
		this.claims = claims;
	}

	@PostMapping("/orders/preview")
	public OrderPreview preview(@AuthenticationPrincipal AuthUser user,
			@Valid @RequestBody OrderPreviewRequest request) {
		return orders.preview(user.id(), request);
	}

	@PostMapping("/orders")
	@ResponseStatus(HttpStatus.CREATED)
	public CreateOrderResponse create(@AuthenticationPrincipal AuthUser user,
			@Valid @RequestBody CreateOrderRequest request) {
		return orders.create(user.id(), request);
	}

	@GetMapping("/me/orders")
	public PageResponse<OrderSummary> myOrders(@AuthenticationPrincipal AuthUser user,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
		return orders.myOrders(user.id(), page, size);
	}

	@GetMapping("/me/orders/{orderNumber}")
	public OrderDetail myOrder(@AuthenticationPrincipal AuthUser user, @PathVariable String orderNumber) {
		return orders.myOrder(user.id(), orderNumber);
	}

	@PostMapping("/me/orders/{orderNumber}/cancel")
	public OrderDetail cancel(@AuthenticationPrincipal AuthUser user, @PathVariable String orderNumber) {
		return orders.cancelByCustomer(user.id(), orderNumber);
	}

	@PostMapping("/me/orders/{orderNumber}/claims")
	@ResponseStatus(HttpStatus.CREATED)
	public ClaimDto claim(@AuthenticationPrincipal AuthUser user, @PathVariable String orderNumber,
			@Valid @RequestBody ClaimRequest request) {
		return claims.request(user.id(), orderNumber, request);
	}
}
