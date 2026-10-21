package com.tukfit;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.tukfit.support.ApiClient;
import com.tukfit.support.Fixtures.TestProduct;
import com.tukfit.support.IntegrationTest;

import tools.jackson.databind.JsonNode;

class CartIntegrationTest extends IntegrationTest {

	@Test
	void addingSameOptionAccumulatesUpToLimit() {
		TestProduct p = fixtures.product("cart", 20000, null, List.of("M"), 20, "블랙");
		ApiClient api = newUser();
		api.post("/api/v1/me/cart/items", Map.of("variantId", p.variant(0), "quantity", 2)).expect(200);
		JsonNode cart = api.post("/api/v1/me/cart/items", Map.of("variantId", p.variant(0), "quantity", 3))
			.expectJson(200);
		assertThat(cart.path("items").size()).isEqualTo(1);
		assertThat(cart.path("items").get(0).path("quantity").asInt()).isEqualTo(5);
		assertThat(cart.path("totals").path("subtotal").asLong()).isEqualTo(100000);
		assertThat(cart.path("totals").path("shippingFee").asLong()).isZero();

		api.post("/api/v1/me/cart/items", Map.of("variantId", p.variant(0), "quantity", 1))
			.expectError(409, "QUANTITY_LIMIT");
	}

	@Test
	void cannotAddMoreThanStock() {
		TestProduct p = fixtures.product("cart", 20000, null, List.of("M"), 2, "블랙");
		newUser().post("/api/v1/me/cart/items", Map.of("variantId", p.variant(0), "quantity", 3))
			.expectError(409, "OUT_OF_STOCK");
	}

	@Test
	void mergeCapsQuantityAndSkipsUnavailable() {
		TestProduct p = fixtures.product("cart", 10000, null, List.of("S", "M"), 3, "블랙");
		TestProduct soldOut = fixtures.product("cart", 10000, null, List.of("M"), 0, "블랙");
		ApiClient api = newUser();
		api.post("/api/v1/me/cart/items", Map.of("variantId", p.variant(0), "quantity", 1)).expect(200);

		JsonNode cart = api.post("/api/v1/me/cart/merge", Map.of("items", List.of(
				Map.of("variantId", p.variant(0), "quantity", 4),
				Map.of("variantId", p.variant(1), "quantity", 2),
				Map.of("variantId", soldOut.variant(0), "quantity", 1),
				Map.of("variantId", 999999999, "quantity", 1)))).expectJson(200);

		assertThat(cart.path("items").size()).isEqualTo(2);
		for (JsonNode item : cart.path("items")) {
			if (item.path("variantId").asLong() == p.variant(0)) {
				assertThat(item.path("quantity").asInt()).isEqualTo(3); // 재고 3에서 멈춤
			}
			else {
				assertThat(item.path("quantity").asInt()).isEqualTo(2);
			}
		}
		assertThat(cart.path("totals").path("subtotal").asLong()).isEqualTo(50000);
		assertThat(cart.path("totals").path("shippingFee").asLong()).isZero();
	}

	@Test
	void cartRequiresLogin() {
		client().get("/api/v1/me/cart").expectError(401, "UNAUTHORIZED");
	}
}
