package com.tukfit;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import org.junit.jupiter.api.Test;

import com.tukfit.support.ApiClient;
import com.tukfit.support.Fixtures.TestProduct;
import com.tukfit.support.IntegrationTest;

import tools.jackson.databind.JsonNode;

class OrderPaymentIntegrationTest extends IntegrationTest {

	private static final Map<String, Object> SHIPPING = Map.of("recipient", "홍길동", "phone", "010-1234-5678",
			"postalCode", "04524", "address1", "서울 중구 세종대로 110");

	@Test
	void previewAppliesCouponAndShippingFee() {
		String code = "T" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
		fixtures.coupon(code, "PERCENT", 10, 2000L, 0, null);
		TestProduct p = fixtures.product("order", 15000, null, List.of("M"), 10, "블랙");
		ApiClient api = newUser();

		JsonNode preview = api.post("/api/v1/orders/preview",
				Map.of("items", List.of(Map.of("variantId", p.variant(0), "quantity", 2)), "couponCode", code))
			.expectJson(200);
		JsonNode totals = preview.path("totals");
		assertThat(totals.path("subtotal").asLong()).isEqualTo(30000);
		assertThat(totals.path("discount").asLong()).isEqualTo(2000); // 10% = 3000, 상한 2000
		assertThat(totals.path("shippingFee").asLong()).isEqualTo(3000); // 5만 원 미만
		assertThat(totals.path("total").asLong()).isEqualTo(31000);
		assertThat(totals.path("freeShippingRemaining").asLong()).isEqualTo(20000);
		assertThat(preview.path("coupon").path("code").asString()).isEqualTo(code);

		JsonNode bad = api.post("/api/v1/orders/preview",
				Map.of("items", List.of(Map.of("variantId", p.variant(0), "quantity", 2)), "couponCode", "NOPE"))
			.expectJson(200);
		assertThat(bad.path("couponError").asString()).isNotBlank();
		assertThat(bad.path("totals").path("discount").asLong()).isZero();
	}

	@Test
	void mockPaymentConfirmDecrementsStockAndMarksPaid() {
		TestProduct p = fixtures.product("order", 60000, null, List.of("M"), 5, "블랙");
		ApiClient api = newUser();
		api.post("/api/v1/me/cart/items", Map.of("variantId", p.variant(0), "quantity", 2)).expect(200);

		JsonNode order = createOrder(api, p.variant(0), 2, true);
		assertThat(order.path("amount").asLong()).isEqualTo(120000);
		assertThat(order.path("payment").path("provider").asString()).isEqualTo("MOCK");
		assertThat(fixtures.stock(p.variant(0))).isEqualTo(5); // 결제 전에는 그대로

		JsonNode detail = confirm(api, order).expectJson(200);
		assertThat(detail.path("status").asString()).isEqualTo("PAID");
		assertThat(detail.path("payment").path("status").asString()).isEqualTo("PAID");
		assertThat(detail.path("cancellable").asBoolean()).isTrue();
		assertThat(fixtures.stock(p.variant(0))).isEqualTo(3);
		assertThat(api.get("/api/v1/me/cart").expectJson(200).path("items").size()).isZero();

		// 같은 결제로 다시 호출해도 재고가 두 번 줄지 않는다.
		confirm(api, order).expect(200);
		assertThat(fixtures.stock(p.variant(0))).isEqualTo(3);
	}

	@Test
	void amountMismatchIsRejected() {
		TestProduct p = fixtures.product("order", 60000, null, List.of("M"), 5, "블랙");
		ApiClient api = newUser();
		JsonNode order = createOrder(api, p.variant(0), 1, false);
		api.post("/api/v1/payments/confirm", Map.of("orderNumber", order.path("orderNumber").asString(),
				"paymentKey", "mock_tampered", "amount", 100)).expectError(422, "PAYMENT_AMOUNT_MISMATCH");
		assertThat(fixtures.stock(p.variant(0))).isEqualTo(5);
	}

	@Test
	void lastUnitRaceOnlyOneOrderSucceedsAndOtherPaymentIsCancelled() {
		TestProduct p = fixtures.product("order", 70000, null, List.of("M"), 1, "블랙");
		ApiClient a = newUser();
		ApiClient b = newUser();
		JsonNode orderA = createOrder(a, p.variant(0), 1, false);
		JsonNode orderB = createOrder(b, p.variant(0), 1, false);

		var fa = CompletableFuture.supplyAsync(() -> confirm(a, orderA).status());
		var fb = CompletableFuture.supplyAsync(() -> confirm(b, orderB).status());
		List<Integer> statuses = List.of(fa.join(), fb.join());

		assertThat(statuses).containsExactlyInAnyOrder(200, 409);
		assertThat(fixtures.stock(p.variant(0))).isZero();
		Integer cancelled = fixtures.jdbc().queryForObject("""
				SELECT count(*) FROM payments p JOIN orders o ON o.id = p.order_id
				WHERE o.order_number IN (?, ?) AND p.status = 'CANCELLED'
				""", Integer.class, orderA.path("orderNumber").asString(), orderB.path("orderNumber").asString());
		assertThat(cancelled).isEqualTo(1);
	}

	@Test
	void customerCancelRefundsAndRestoresStock() {
		TestProduct p = fixtures.product("order", 60000, null, List.of("M"), 5, "블랙");
		ApiClient api = newUser();
		JsonNode order = createOrder(api, p.variant(0), 2, false);
		confirm(api, order).expect(200);
		assertThat(fixtures.stock(p.variant(0))).isEqualTo(3);

		JsonNode cancelled = api.post("/api/v1/me/orders/" + order.path("orderNumber").asString() + "/cancel", null)
			.expectJson(200);
		assertThat(cancelled.path("status").asString()).isEqualTo("CANCELLED");
		assertThat(cancelled.path("payment").path("cancelledAmount").asLong()).isEqualTo(120000);
		assertThat(fixtures.stock(p.variant(0))).isEqualTo(5);

		api.post("/api/v1/me/orders/" + order.path("orderNumber").asString() + "/cancel", null)
			.expectError(409, "ORDER_NOT_CANCELLABLE");
	}

	@Test
	void adminApiIsForbiddenForUsers() {
		ApiClient user = newUser();
		user.get("/api/v1/admin/dashboard").expectError(403, "FORBIDDEN");
		user.get("/api/v1/admin/orders").expectError(403, "FORBIDDEN");
		client().get("/api/v1/admin/dashboard").expectError(401, "UNAUTHORIZED");
		newAdmin().get("/api/v1/admin/dashboard").expect(200);
	}

	@Test
	void returnClaimCompletionRefundsPartiallyAndRestoresStock() {
		TestProduct p = fixtures.product("order", 40000, null, List.of("M"), 5, "블랙");
		ApiClient user = newUser();
		ApiClient admin = newAdmin();
		JsonNode order = createOrder(user, p.variant(0), 2, false);
		String number = order.path("orderNumber").asString();
		confirm(user, order).expect(200);

		admin.post("/api/v1/admin/orders/" + number + "/shipment",
				Map.of("carrier", "CJ", "trackingNumber", "123456789012")).expect(200);
		JsonNode delivered = admin.patch("/api/v1/admin/orders/" + number + "/status", Map.of("status", "DELIVERED"))
			.expectJson(200);
		assertThat(delivered.path("status").asString()).isEqualTo("DELIVERED");
		assertThat(delivered.path("shipment").path("trackingUrl").asString()).contains("123456789012");

		long itemId = user.get("/api/v1/me/orders/" + number).expectJson(200).path("items").get(0).path("id").asLong();
		JsonNode claim = user.post("/api/v1/me/orders/" + number + "/claims", Map.of("orderItemId", itemId, "type",
				"RETURN", "reasonType", "SIZE", "quantity", 1)).expectJson(201);
		assertThat(claim.path("returnShippingFee").asLong()).isEqualTo(6000);
		long claimId = claim.path("id").asLong();

		admin.patch("/api/v1/admin/claims/" + claimId, Map.of("status", "COMPLETED")).expectError(409,
				"CLAIM_STATUS_INVALID");
		admin.patch("/api/v1/admin/claims/" + claimId, Map.of("status", "APPROVED")).expect(200);
		JsonNode done = admin.patch("/api/v1/admin/claims/" + claimId, Map.of("status", "COMPLETED")).expectJson(200);
		assertThat(done.path("status").asString()).isEqualTo("COMPLETED");
		assertThat(done.path("refundAmount").asLong()).isEqualTo(34000); // 40,000 - 반품 배송비 6,000

		JsonNode adminOrder = admin.get("/api/v1/admin/orders/" + number).expectJson(200);
		assertThat(adminOrder.path("payment").path("status").asString()).isEqualTo("PARTIAL_CANCELLED");
		assertThat(adminOrder.path("payment").path("cancelledAmount").asLong()).isEqualTo(34000);
		assertThat(fixtures.stock(p.variant(0))).isEqualTo(4); // 5 - 2 + 1

		// 남은 1개만 더 신청할 수 있다.
		user.post("/api/v1/me/orders/" + number + "/claims", Map.of("orderItemId", itemId, "type", "RETURN",
				"reasonType", "DEFECT", "quantity", 2)).expectError(409, "CLAIM_NOT_ALLOWED");
	}

	@Test
	void reviewOnlyAfterDelivery() {
		TestProduct p = fixtures.product("order", 40000, null, List.of("M"), 5, "블랙");
		ApiClient user = newUser();
		ApiClient admin = newAdmin();
		JsonNode order = createOrder(user, p.variant(0), 1, false);
		String number = order.path("orderNumber").asString();
		confirm(user, order).expect(200);
		long itemId = user.get("/api/v1/me/orders/" + number).expectJson(200).path("items").get(0).path("id").asLong();

		Map<String, Object> review = Map.of("orderItemId", itemId, "rating", 5, "body", "좋아요");
		user.post("/api/v1/reviews", review).expectError(409, "REVIEW_NOT_ALLOWED");

		admin.post("/api/v1/admin/orders/" + number + "/shipment", Map.of("carrier", "CJ", "trackingNumber", "111"))
			.expect(200);
		admin.patch("/api/v1/admin/orders/" + number + "/status", Map.of("status", "DELIVERED")).expect(200);
		assertThat(user.get("/api/v1/me/reviewable-items").expectJson(200).size()).isEqualTo(1);
		user.post("/api/v1/reviews", review).expect(201);
		user.post("/api/v1/reviews", review).expectError(409, "REVIEW_DUPLICATED");

		JsonNode reviews = client().get("/api/v1/products/" + p.slug() + "/reviews").expectJson(200);
		assertThat(reviews.path("summary").path("count").asLong()).isEqualTo(1);
		assertThat(reviews.path("page").path("items").get(0).path("authorName").asString()).isEqualTo("테**");
	}

	private JsonNode createOrder(ApiClient api, long variantId, int quantity, boolean fromCart) {
		return api.post("/api/v1/orders", Map.of("items", List.of(Map.of("variantId", variantId, "quantity", quantity)),
				"shipping", SHIPPING, "saveAddress", false, "fromCart", fromCart)).expectJson(201);
	}

	private ApiClient.Response confirm(ApiClient api, JsonNode order) {
		return api.post("/api/v1/payments/confirm", Map.of("orderNumber", order.path("orderNumber").asString(),
				"paymentKey", "mock_" + order.path("orderNumber").asString(), "amount", order.path("amount").asLong()));
	}
}
