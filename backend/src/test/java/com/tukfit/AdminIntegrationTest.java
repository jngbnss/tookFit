package com.tukfit;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.tukfit.support.ApiClient;
import com.tukfit.support.Fixtures.TestProduct;
import com.tukfit.support.IntegrationTest;

import tools.jackson.databind.JsonNode;

class AdminIntegrationTest extends IntegrationTest {

	@Test
	void orderAndUserSearchWorkWithAndWithoutFilters() {
		TestProduct p = fixtures.product("admin", 30000, null, List.of("M"), 5, "블랙");
		ApiClient user = newUser();
		String number = user.post("/api/v1/orders", Map.of("items", List.of(Map.of("variantId", p.variant(0), "quantity", 1)),
				"shipping", Map.of("recipient", "검색대상", "phone", "010-9999-8888", "postalCode", "04524", "address1", "서울"),
				"saveAddress", false, "fromCart", false)).expectJson(201).path("orderNumber").asString();
		ApiClient admin = newAdmin();

		assertThat(admin.get("/api/v1/admin/orders").expectJson(200).path("totalElements").asLong()).isPositive();
		JsonNode byQuery = admin.get("/api/v1/admin/orders?q=" + number).expectJson(200);
		assertThat(byQuery.path("totalElements").asLong()).isEqualTo(1);
		assertThat(byQuery.path("items").get(0).path("recipient").asString()).isEqualTo("검색대상");
		assertThat(admin.get("/api/v1/admin/orders?status=PENDING_PAYMENT&from=2020-01-01&to=2099-12-31&q=9999-8888")
			.expectJson(200).path("totalElements").asLong()).isPositive();

		assertThat(admin.get("/api/v1/admin/users").expectJson(200).path("totalElements").asLong()).isPositive();
		JsonNode users = admin.get("/api/v1/admin/users?q=test.local&role=USER").expectJson(200);
		assertThat(users.path("items").get(0).path("role").asString()).isEqualTo("USER");
		long userId = users.path("items").get(0).path("id").asLong();
		assertThat(admin.get("/api/v1/admin/users/" + userId).expectJson(200).has("recentOrders")).isTrue();
	}

	@Test
	void otherAdminListsRespond() {
		ApiClient admin = newAdmin();
		for (String path : List.of("/api/v1/admin/products", "/api/v1/admin/products?status=ACTIVE&q=a",
				"/api/v1/admin/categories", "/api/v1/admin/claims", "/api/v1/admin/claims?status=REQUESTED",
				"/api/v1/admin/reviews", "/api/v1/admin/reviews?status=VISIBLE&rating=5", "/api/v1/admin/coupons",
				"/api/v1/admin/banners", "/api/v1/admin/banners?position=MAIN_HERO", "/api/v1/admin/notices",
				"/api/v1/admin/settings", "/api/v1/admin/dashboard")) {
			admin.get(path).expect(200);
		}
	}

	@Test
	void csvExportHasFilenameAndBom() {
		var response = newAdmin().get("/api/v1/admin/orders/export?from=2026-01-01&to=2026-12-31").expect(200);
		assertThat(response.raw().headers().firstValue("content-disposition").orElse(""))
			.contains("attachment").contains("filename=\"orders-");
		assertThat(response.body()).startsWith("﻿주문번호");
	}

	@Test
	void productEditingFlow() {
		ApiClient admin = newAdmin();
		long categoryId = fixtures.category("admin-edit");
		String slug = "edit-" + System.nanoTime();
		JsonNode created = admin.post("/api/v1/admin/products", Map.of("slug", slug, "name", "새 상품", "categoryId",
				categoryId, "price", 10000, "care", List.of("손세탁"), "status", "DRAFT")).expectJson(201);
		long id = created.path("id").asLong();

		JsonNode withColors = admin.put("/api/v1/admin/products/" + id + "/colors",
				List.of(Map.of("name", "블랙", "hex", "#000000", "sortOrder", 0))).expectJson(200);
		long colorId = withColors.path("colors").get(0).path("id").asLong();
		JsonNode withVariants = admin.put("/api/v1/admin/products/" + id + "/variants",
				List.of(Map.of("colorId", colorId, "size", "m", "stock", 3, "active", true))).expectJson(200);
		assertThat(withVariants.path("variants").get(0).path("size").asString()).isEqualTo("M");
		assertThat(withVariants.path("variants").get(0).path("sku").asString()).isNotBlank();
		long variantId = withVariants.path("variants").get(0).path("id").asLong();

		// 두 번째 색상과 옵션을 만들었다가 색상째 지운다 (주문 이력 없음).
		JsonNode two = admin.put("/api/v1/admin/products/" + id + "/colors", List.of(
				Map.of("id", colorId, "name", "블랙", "hex", "#000000", "sortOrder", 0),
				Map.of("name", "화이트", "hex", "#ffffff", "sortOrder", 1))).expectJson(200);
		long whiteId = two.path("colors").get(1).path("id").asLong();
		admin.put("/api/v1/admin/products/" + id + "/variants", List.of(
				Map.of("id", variantId, "colorId", colorId, "size", "M", "stock", 3, "active", true),
				Map.of("colorId", whiteId, "size", "L", "stock", 1, "active", true))).expect(200);
		JsonNode one = admin.put("/api/v1/admin/products/" + id + "/colors",
				List.of(Map.of("id", colorId, "name", "블랙", "hex", "#000000", "sortOrder", 0))).expectJson(200);
		assertThat(one.path("colors").size()).isEqualTo(1);
		assertThat(one.path("variants").size()).isEqualTo(1);

		admin.patch("/api/v1/admin/variants/" + variantId + "/stock", Map.of("delta", 2)).expect(200);
		assertThat(fixtures.stock(variantId)).isEqualTo(5);

		admin.put("/api/v1/admin/products/" + id + "/images",
				List.of(Map.of("storageKey", "products/x.webp", "colorId", colorId, "sortOrder", 0))).expect(200);
		client().get("/api/v1/products/" + slug).expect(404); // 아직 DRAFT
		admin.patch("/api/v1/admin/products/" + id, Map.of("slug", slug, "name", "새 상품", "categoryId", categoryId,
				"price", 10000, "status", "ACTIVE")).expect(200);
		JsonNode detail = client().get("/api/v1/products/" + slug).expectJson(200);
		assertThat(detail.path("inStock").asBoolean()).isTrue();

		admin.delete("/api/v1/admin/products/" + id).expect(204);
		client().get("/api/v1/products/" + slug).expect(404);
	}

	@Test
	void myReviewsIncludeProductInfo() {
		ApiClient user = newUser();
		JsonNode page = user.get("/api/v1/me/reviews").expectJson(200);
		assertThat(page.has("items")).isTrue();
		assertThat(page.has("totalElements")).isTrue();
	}
}
