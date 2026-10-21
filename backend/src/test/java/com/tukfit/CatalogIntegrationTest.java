package com.tukfit;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.tukfit.support.Fixtures.TestProduct;
import com.tukfit.support.IntegrationTest;

import tools.jackson.databind.JsonNode;

class CatalogIntegrationTest extends IntegrationTest {

	@Test
	void filtersBySizeColorPriceStockAndSale() {
		String cat = "c" + UUID.randomUUID().toString().substring(0, 8);
		TestProduct cheap = fixtures.product(cat, 30000, null, List.of("S", "M"), 5, "블랙");
		TestProduct sale = fixtures.product(cat, 80000, 100000L, List.of("M", "L"), 5, "네이비");
		TestProduct soldOut = fixtures.product(cat, 50000, null, List.of("L"), 0, "블랙");

		var api = client();
		assertThat(slugs(api.get("/api/v1/products?category=" + cat).expectJson(200)))
			.containsExactlyInAnyOrder(cheap.slug(), sale.slug(), soldOut.slug());
		assertThat(slugs(api.get("/api/v1/products?category=" + cat + "&sizes=L").expectJson(200)))
			.containsExactlyInAnyOrder(sale.slug(), soldOut.slug());
		assertThat(slugs(api.get("/api/v1/products?category=" + cat + "&sizes=L&inStock=true").expectJson(200)))
			.containsExactly(sale.slug());
		assertThat(slugs(api.get("/api/v1/products?category=" + cat + "&colors=%EB%B8%94%EB%9E%99").expectJson(200)))
			.containsExactlyInAnyOrder(cheap.slug(), soldOut.slug());
		assertThat(slugs(api.get("/api/v1/products?category=" + cat + "&minPrice=40000&maxPrice=90000").expectJson(200)))
			.containsExactlyInAnyOrder(sale.slug(), soldOut.slug());
		assertThat(slugs(api.get("/api/v1/products?category=" + cat + "&collection=sale").expectJson(200)))
			.containsExactly(sale.slug());
		assertThat(slugs(api.get("/api/v1/products?category=" + cat + "&sort=price-desc").expectJson(200)))
			.containsExactly(sale.slug(), soldOut.slug(), cheap.slug());

		JsonNode page = api.get("/api/v1/products?category=" + cat + "&size=2&sort=price-asc").expectJson(200);
		assertThat(page.path("totalElements").asInt()).isEqualTo(3);
		assertThat(page.path("totalPages").asInt()).isEqualTo(2);
		JsonNode first = page.path("items").get(0);
		assertThat(first.path("discountRate").asInt()).isZero();
		assertThat(first.path("thumbnailUrl").asString()).endsWith("products/" + cheap.slug() + ".webp");

		JsonNode saleDetail = api.get("/api/v1/products/" + sale.slug()).expectJson(200);
		assertThat(saleDetail.path("discountRate").asInt()).isEqualTo(20);
		assertThat(saleDetail.path("sizes").size()).isEqualTo(2);
		assertThat(saleDetail.path("variants").size()).isEqualTo(2);
	}

	@Test
	void hiddenProductIsNotFound() {
		TestProduct p = fixtures.product("hidden-cat", 10000, null, List.of("M"), 1, "블랙");
		fixtures.jdbc().update("UPDATE products SET status = 'HIDDEN' WHERE id = ?", p.id());
		client().get("/api/v1/products/" + p.slug()).expectError(404, "PRODUCT_NOT_FOUND");
	}

	private static List<String> slugs(JsonNode page) {
		List<String> slugs = new ArrayList<>();
		page.path("items").forEach(item -> slugs.add(item.path("slug").asString()));
		return slugs;
	}
}
