package com.tukfit.admin;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tukfit.admin.AdminDtos.AdminCategory;
import com.tukfit.admin.AdminDtos.AdminCategoryRequest;
import com.tukfit.admin.AdminDtos.AdminColor;
import com.tukfit.admin.AdminDtos.AdminImage;
import com.tukfit.admin.AdminDtos.AdminProductDetail;
import com.tukfit.admin.AdminDtos.AdminProductRequest;
import com.tukfit.admin.AdminDtos.AdminProductSummary;
import com.tukfit.admin.AdminDtos.AdminVariant;
import com.tukfit.admin.AdminDtos.ColorInput;
import com.tukfit.admin.AdminDtos.ImageInput;
import com.tukfit.admin.AdminDtos.StockRequest;
import com.tukfit.admin.AdminDtos.VariantInput;
import com.tukfit.catalog.Category;
import com.tukfit.catalog.CategoryRepository;
import com.tukfit.catalog.Product;
import com.tukfit.catalog.ProductColor;
import com.tukfit.catalog.ProductImage;
import com.tukfit.catalog.ProductMapper;
import com.tukfit.catalog.ProductRepository;
import com.tukfit.catalog.ProductStatus;
import com.tukfit.catalog.ProductVariant;
import com.tukfit.catalog.ProductVariantRepository;
import com.tukfit.global.error.ApiException;
import com.tukfit.global.error.ErrorCode;
import com.tukfit.global.web.PageResponse;

import jakarta.persistence.EntityManager;

@Service
@Transactional
public class AdminProductService {

	private final ProductRepository products;
	private final CategoryRepository categories;
	private final ProductVariantRepository variants;
	private final ProductMapper mapper;
	private final EntityManager em;

	public AdminProductService(ProductRepository products, CategoryRepository categories,
			ProductVariantRepository variants, ProductMapper mapper, EntityManager em) {
		this.products = products;
		this.categories = categories;
		this.variants = variants;
		this.mapper = mapper;
		this.em = em;
	}

	// 상품 -----------------------------------------------------------------

	@Transactional(readOnly = true)
	public PageResponse<AdminProductSummary> list(ProductStatus status, String category, String q, int page,
			int size) {
		Specification<Product> spec = (root, query, cb) -> {
			var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
			if (status != null) {
				predicates.add(cb.equal(root.get("status"), status));
			}
			if (category != null && !category.isBlank()) {
				predicates.add(cb.equal(root.get("category").get("slug"), category));
			}
			if (q != null && !q.isBlank()) {
				String like = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
				predicates.add(cb.or(cb.like(cb.lower(root.get("name")), like), cb.like(root.get("slug"), like)));
			}
			return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
		};
		var pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100),
				Sort.by(Sort.Order.desc("updatedAt"), Sort.Order.desc("id")));
		return PageResponse.of(products.findAll(spec, pageable), this::summary);
	}

	@Transactional(readOnly = true)
	public AdminProductDetail get(Long id) {
		return detail(find(id));
	}

	public AdminProductDetail create(AdminProductRequest r) {
		if (products.existsBySlug(r.slug())) {
			throw new ApiException(ErrorCode.SLUG_DUPLICATED);
		}
		Product product = new Product(r.slug(), category(r.categoryId()));
		apply(product, r);
		return detail(products.save(product));
	}

	public AdminProductDetail update(Long id, AdminProductRequest r) {
		Product product = find(id);
		if (products.existsBySlugAndIdNot(r.slug(), id)) {
			throw new ApiException(ErrorCode.SLUG_DUPLICATED);
		}
		apply(product, r);
		return detail(product);
	}

	/** 주문 이력이 있으면 숨김 처리, 없으면 관련 데이터와 함께 삭제한다. */
	public void delete(Long id) {
		Product product = find(id);
		if (variants.isProductOrdered(id)) {
			product.changeStatus(ProductStatus.HIDDEN);
			return;
		}
		em.createNativeQuery("DELETE FROM cart_items WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = ?1)")
			.setParameter(1, id).executeUpdate();
		em.createNativeQuery("DELETE FROM wishlists WHERE product_id = ?1").setParameter(1, id).executeUpdate();
		em.createNativeQuery("DELETE FROM reviews WHERE product_id = ?1").setParameter(1, id).executeUpdate();
		// 색상·옵션·이미지는 DB의 ON DELETE CASCADE로 함께 지운다.
		em.detach(product);
		em.createNativeQuery("DELETE FROM products WHERE id = ?1").setParameter(1, id).executeUpdate();
	}

	/** 목록에 없는 기존 색상은 삭제한다. 주문된 옵션이 있는 색상은 지울 수 없다. */
	public AdminProductDetail putColors(Long id, List<ColorInput> inputs) {
		Product product = find(id);
		Set<Long> keep = new HashSet<>();
		for (ColorInput input : inputs) {
			if (input.id() != null) {
				keep.add(input.id());
			}
		}
		for (ProductColor color : List.copyOf(product.getColors())) {
			if (keep.contains(color.getId())) {
				continue;
			}
			if (variants.isColorOrdered(color.getId())) {
				throw new ApiException(ErrorCode.IN_USE, "'" + color.getName() + "' 색상은 주문 이력이 있어 삭제할 수 없어요. 옵션을 판매 중지해주세요.");
			}
			List<ProductVariant> colorVariants = product.getVariants().stream()
					.filter(v -> v.getColor().getId().equals(color.getId())).toList();
			for (ProductVariant v : colorVariants) {
				em.createNativeQuery("DELETE FROM cart_items WHERE variant_id = ?1").setParameter(1, v.getId())
					.executeUpdate();
				product.getVariants().remove(v);
				em.remove(v);
			}
			product.getImages().stream().filter(i -> i.getColor() != null && i.getColor().getId().equals(color.getId()))
				.forEach(ProductImage::detachColor);
			product.getColors().remove(color);
		}
		for (ColorInput input : inputs) {
			if (input.id() == null) {
				product.getColors().add(new ProductColor(product, input.name().trim(), input.hex(), input.sortOrder()));
			}
			else {
				ProductColor color = product.getColors().stream().filter(c -> c.getId().equals(input.id())).findFirst()
						.orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "색상을 찾을 수 없어요."));
				color.update(input.name().trim(), input.hex(), input.sortOrder());
			}
		}
		em.flush();
		return detail(product);
	}

	/** 옵션·재고 일괄 저장. 목록에 없는 기존 옵션은 판매 중지(active=false)한다. */
	public AdminProductDetail putVariants(Long id, List<VariantInput> inputs) {
		Product product = find(id);
		Map<Long, ProductColor> colors = new HashMap<>();
		product.getColors().forEach(c -> colors.put(c.getId(), c));
		Set<String> seen = new HashSet<>();
		Set<Long> touched = new HashSet<>();
		for (VariantInput input : inputs) {
			String size = input.size().trim().toUpperCase(Locale.ROOT);
			ProductColor color = colors.get(input.colorId());
			if (color == null) {
				throw new ApiException(ErrorCode.VALIDATION_FAILED, "이 상품의 색상이 아니에요.");
			}
			if (!seen.add(color.getId() + "/" + size)) {
				throw new ApiException(ErrorCode.VALIDATION_FAILED, color.getName() + " / " + size + " 옵션이 중복됐어요.");
			}
			ProductVariant variant = product.getVariants().stream()
					.filter(v -> input.id() != null ? v.getId().equals(input.id())
							: v.getColor().getId().equals(color.getId()) && v.getSize().equals(size))
					.findFirst().orElse(null);
			String sku = input.sku() == null || input.sku().isBlank() ? null : input.sku().trim().toUpperCase(Locale.ROOT);
			if (variant == null) {
				if (input.id() != null) {
					throw new ApiException(ErrorCode.VARIANT_NOT_FOUND);
				}
				String newSku = sku != null ? sku : generateSku(product, color, size);
				ensureSkuFree(newSku, null);
				variant = new ProductVariant(product, color, size, newSku, input.stock(), input.active());
				product.getVariants().add(variant);
			}
			else {
				String newSku = sku != null ? sku : variant.getSku();
				ensureSkuFree(newSku, variant.getId());
				variant.update(newSku, input.stock(), input.active());
			}
			if (variant.getId() != null) {
				touched.add(variant.getId());
			}
		}
		for (ProductVariant v : product.getVariants()) {
			if (v.getId() != null && !touched.contains(v.getId())) {
				v.deactivate();
			}
		}
		em.flush();
		return detail(product);
	}

	public AdminVariant patchStock(Long variantId, StockRequest request) {
		ProductVariant variant = variants.findById(variantId)
				.orElseThrow(() -> new ApiException(ErrorCode.VARIANT_NOT_FOUND));
		if (request.stock() != null) {
			variant.setStock(request.stock());
		}
		else if (request.delta() != null) {
			int next = variant.getStock() + request.delta();
			if (next < 0) {
				throw new ApiException(ErrorCode.VALIDATION_FAILED, "재고는 0보다 작을 수 없어요.");
			}
			variant.setStock(next);
		}
		else {
			throw new ApiException(ErrorCode.VALIDATION_FAILED, "stock 또는 delta를 입력해주세요.");
		}
		return adminVariant(variant);
	}

	public AdminProductDetail putImages(Long id, List<ImageInput> inputs) {
		Product product = find(id);
		Map<Long, ProductColor> colors = new HashMap<>();
		product.getColors().forEach(c -> colors.put(c.getId(), c));
		Set<Long> keep = new HashSet<>();
		inputs.stream().map(ImageInput::id).filter(Objects::nonNull).forEach(keep::add);
		product.getImages().removeIf(i -> !keep.contains(i.getId()));
		for (ImageInput input : inputs) {
			ProductColor color = input.colorId() == null ? null : colors.get(input.colorId());
			if (input.colorId() != null && color == null) {
				throw new ApiException(ErrorCode.VALIDATION_FAILED, "이 상품의 색상이 아니에요.");
			}
			ProductImage image = input.id() == null ? null
					: product.getImages().stream().filter(i -> i.getId().equals(input.id())).findFirst()
							.orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "이미지를 찾을 수 없어요."));
			if (image == null) {
				image = new ProductImage(product);
				product.getImages().add(image);
			}
			image.update(color, input.storageKey().trim(), blank(input.alt()), input.sortOrder());
		}
		product.getImages().sort(java.util.Comparator.comparingInt(ProductImage::getSortOrder));
		em.flush();
		return detail(product);
	}

	// 카테고리 ---------------------------------------------------------------

	@Transactional(readOnly = true)
	public List<AdminCategory> categories() {
		return categories.findAllByOrderBySortOrderAscIdAsc().stream()
				.map(c -> new AdminCategory(c.getId(), c.getSlug(), c.getName(), c.getSortOrder(), c.isVisible(),
						products.countByCategoryId(c.getId())))
				.toList();
	}

	public AdminCategory createCategory(AdminCategoryRequest r) {
		if (categories.existsBySlug(r.slug())) {
			throw new ApiException(ErrorCode.SLUG_DUPLICATED);
		}
		Category c = categories.save(new Category(r.slug(), r.name().trim(), r.sortOrder(), r.visible()));
		return new AdminCategory(c.getId(), c.getSlug(), c.getName(), c.getSortOrder(), c.isVisible(), 0);
	}

	public AdminCategory updateCategory(Long id, AdminCategoryRequest r) {
		Category c = category(id);
		categories.findBySlug(r.slug()).filter(other -> !other.getId().equals(id)).ifPresent(other -> {
			throw new ApiException(ErrorCode.SLUG_DUPLICATED);
		});
		c.update(r.slug(), r.name().trim(), r.sortOrder(), r.visible());
		return new AdminCategory(c.getId(), c.getSlug(), c.getName(), c.getSortOrder(), c.isVisible(),
				products.countByCategoryId(id));
	}

	public void deleteCategory(Long id) {
		Category c = category(id);
		if (products.countByCategoryId(id) > 0) {
			throw new ApiException(ErrorCode.IN_USE, "상품이 있는 카테고리는 삭제할 수 없어요.");
		}
		categories.delete(c);
	}

	// 변환 -----------------------------------------------------------------

	private AdminProductSummary summary(Product p) {
		int totalStock = p.getVariants().stream().filter(ProductVariant::isActive).mapToInt(ProductVariant::getStock)
				.sum();
		int variantCount = (int) p.getVariants().stream().filter(ProductVariant::isActive).count();
		return new AdminProductSummary(p.getId(), p.getSlug(), p.getName(), p.getCategory().getName(), p.getPrice(),
				p.getOriginalPrice(), p.getStatus(), p.getBadge(), mapper.thumbnail(p), totalStock, variantCount,
				p.getUpdatedAt());
	}

	AdminProductDetail detail(Product p) {
		Map<Long, String> keys = new HashMap<>();
		p.getImages().forEach(i -> keys.put(i.getId(), i.getStorageKey()));
		return new AdminProductDetail(p.getId(), p.getSlug(), p.getName(), p.getCategory().getId(),
				p.getDescription(), p.getPrice(), p.getOriginalPrice(), p.getBadge(), p.getMaterial(), p.getFit(),
				p.careList(), p.getStatus(), p.getFeaturedRank(), p.getPublishedAt(),
				p.getColors().stream().map(c -> new AdminColor(c.getId(), c.getName(), c.getHex(), c.getSortOrder()))
						.toList(),
				p.getVariants().stream().map(this::adminVariant).toList(),
				mapper.images(p).stream().map(dto -> AdminImage.of(dto, keys.get(dto.id()))).toList());
	}

	private AdminVariant adminVariant(ProductVariant v) {
		return new AdminVariant(v.getId(), v.getColor().getId(), v.getSize(), v.getSku(), v.getStock(),
				v.isAvailable(), v.isActive());
	}

	private void apply(Product product, AdminProductRequest r) {
		if (r.originalPrice() != null && r.originalPrice() < r.price()) {
			throw new ApiException(ErrorCode.VALIDATION_FAILED, "정가는 판매가보다 크거나 같아야 해요.");
		}
		product.update(r.slug(), category(r.categoryId()), r.name().trim(), blank(r.description()), r.price(),
				r.originalPrice(), r.badge(), blank(r.material()), blank(r.fit()),
				r.care() == null ? List.of() : r.care().stream().map(String::trim).filter(s -> !s.isEmpty()).toList(),
				r.status(), r.featuredRank());
	}

	private String generateSku(Product product, ProductColor color, String size) {
		String base = ("P" + product.getId() + "-" + (color.getId() == null ? "N" : color.getId()) + "-" + size)
				.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9-]", "");
		String sku = base;
		int n = 2;
		while (variants.existsBySku(sku)) {
			sku = base + "-" + n++;
		}
		return sku;
	}

	private void ensureSkuFree(String sku, Long variantId) {
		Long owner = em.createQuery("select v.id from ProductVariant v where v.sku = :sku", Long.class)
				.setParameter("sku", sku).getResultStream().findFirst().orElse(null);
		if (owner != null && !owner.equals(variantId)) {
			throw new ApiException(ErrorCode.CODE_DUPLICATED, "이미 사용 중인 SKU예요: " + sku);
		}
	}

	private Product find(Long id) {
		return products.findById(id).orElseThrow(() -> new ApiException(ErrorCode.PRODUCT_NOT_FOUND));
	}

	private Category category(Long id) {
		return categories.findById(id).orElseThrow(() -> new ApiException(ErrorCode.CATEGORY_NOT_FOUND));
	}

	private static String blank(String v) {
		return v == null || v.isBlank() ? null : v.trim();
	}
}
