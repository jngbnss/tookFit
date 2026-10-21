package com.tukfit.admin;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.tukfit.admin.AdminDtos.AdminCategory;
import com.tukfit.admin.AdminDtos.AdminCategoryRequest;
import com.tukfit.admin.AdminDtos.AdminProductDetail;
import com.tukfit.admin.AdminDtos.AdminProductRequest;
import com.tukfit.admin.AdminDtos.AdminProductSummary;
import com.tukfit.admin.AdminDtos.AdminVariant;
import com.tukfit.admin.AdminDtos.ColorInput;
import com.tukfit.admin.AdminDtos.ImageInput;
import com.tukfit.admin.AdminDtos.PresignRequest;
import com.tukfit.admin.AdminDtos.StockRequest;
import com.tukfit.admin.AdminDtos.VariantInput;
import com.tukfit.catalog.ProductStatus;
import com.tukfit.global.web.PageResponse;
import com.tukfit.storage.StorageService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminCatalogController {

	private final AdminProductService products;
	private final StorageService storage;

	public AdminCatalogController(AdminProductService products, StorageService storage) {
		this.products = products;
		this.storage = storage;
	}

	@GetMapping("/products")
	public PageResponse<AdminProductSummary> list(@RequestParam(required = false) ProductStatus status,
			@RequestParam(required = false) String category, @RequestParam(required = false) String q,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
		return products.list(status, category, q, page, size);
	}

	@PostMapping("/products")
	@ResponseStatus(HttpStatus.CREATED)
	public AdminProductDetail create(@Valid @RequestBody AdminProductRequest request) {
		return products.create(request);
	}

	@GetMapping("/products/{id}")
	public AdminProductDetail get(@PathVariable Long id) {
		return products.get(id);
	}

	@PatchMapping("/products/{id}")
	public AdminProductDetail update(@PathVariable Long id, @Valid @RequestBody AdminProductRequest request) {
		return products.update(id, request);
	}

	@DeleteMapping("/products/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable Long id) {
		products.delete(id);
	}

	@PutMapping("/products/{id}/colors")
	public AdminProductDetail colors(@PathVariable Long id, @RequestBody List<@Valid ColorInput> colors) {
		return products.putColors(id, colors);
	}

	@PutMapping("/products/{id}/variants")
	public AdminProductDetail variants(@PathVariable Long id, @RequestBody List<@Valid VariantInput> variants) {
		return products.putVariants(id, variants);
	}

	@PatchMapping("/variants/{id}/stock")
	public AdminVariant stock(@PathVariable Long id, @Valid @RequestBody StockRequest request) {
		return products.patchStock(id, request);
	}

	@PutMapping("/products/{id}/images")
	public AdminProductDetail images(@PathVariable Long id, @RequestBody List<@Valid ImageInput> images) {
		return products.putImages(id, images);
	}

	@PostMapping("/uploads/presign")
	public StorageService.Presigned presign(@Valid @RequestBody PresignRequest request) {
		return storage.presign(request.filename(), request.contentType(), request.folder());
	}

	@GetMapping("/categories")
	public List<AdminCategory> categories() {
		return products.categories();
	}

	@PostMapping("/categories")
	@ResponseStatus(HttpStatus.CREATED)
	public AdminCategory createCategory(@Valid @RequestBody AdminCategoryRequest request) {
		return products.createCategory(request);
	}

	@PatchMapping("/categories/{id}")
	public AdminCategory updateCategory(@PathVariable Long id, @Valid @RequestBody AdminCategoryRequest request) {
		return products.updateCategory(id, request);
	}

	@DeleteMapping("/categories/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteCategory(@PathVariable Long id) {
		products.deleteCategory(id);
	}
}
