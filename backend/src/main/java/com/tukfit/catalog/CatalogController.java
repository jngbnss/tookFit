package com.tukfit.catalog;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tukfit.catalog.CatalogDtos.CategoryDto;
import com.tukfit.catalog.CatalogDtos.ProductDetail;
import com.tukfit.catalog.CatalogDtos.ProductSummary;
import com.tukfit.catalog.CatalogDtos.Suggestion;
import com.tukfit.global.web.PageResponse;

@RestController
@RequestMapping("/api/v1")
public class CatalogController {

	private final CatalogService catalog;

	public CatalogController(CatalogService catalog) {
		this.catalog = catalog;
	}

	@GetMapping("/categories")
	public List<CategoryDto> categories() {
		return catalog.categories();
	}

	@GetMapping("/products")
	public PageResponse<ProductSummary> products(@RequestParam(required = false) String q,
			@RequestParam(defaultValue = "all") String collection,
			@RequestParam(required = false) String category,
			@RequestParam(required = false) String sizes,
			@RequestParam(required = false) String colors,
			@RequestParam(required = false) Long minPrice,
			@RequestParam(required = false) Long maxPrice,
			@RequestParam(defaultValue = "false") boolean inStock,
			@RequestParam(defaultValue = "featured") String sort,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "" + CatalogService.DEFAULT_PAGE_SIZE) int size) {
		var filter = new ProductSpecs.Filter(q, collection, category, CatalogService.splitCsv(sizes),
				CatalogService.splitCsv(colors), minPrice, maxPrice, inStock);
		return catalog.search(filter, sort, page, size);
	}

	@GetMapping("/products/suggestions")
	public List<Suggestion> suggestions(@RequestParam(required = false) String q) {
		return catalog.suggestions(q);
	}

	@GetMapping("/products/{slug}")
	public ProductDetail product(@PathVariable String slug) {
		return catalog.detail(slug);
	}

	@GetMapping("/products/{slug}/related")
	public List<ProductSummary> related(@PathVariable String slug) {
		return catalog.related(slug);
	}
}
