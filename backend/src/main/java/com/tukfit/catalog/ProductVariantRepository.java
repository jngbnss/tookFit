package com.tukfit.catalog;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

	@EntityGraph(attributePaths = { "product", "color" })
	List<ProductVariant> findByIdIn(Collection<Long> ids);

	boolean existsBySku(String sku);

	/** 재고를 원자적으로 줄인다. 재고가 모자라면 0을 돌려준다. */
	@Modifying(flushAutomatically = true)
	@Query(value = "UPDATE product_variants SET stock = stock - :qty, updated_at = now() WHERE id = :id AND stock >= :qty",
			nativeQuery = true)
	int decrementStock(@Param("id") Long id, @Param("qty") int qty);

	@Modifying(flushAutomatically = true)
	@Query(value = "UPDATE product_variants SET stock = stock + :qty, updated_at = now() WHERE id = :id",
			nativeQuery = true)
	int incrementStock(@Param("id") Long id, @Param("qty") int qty);

	@EntityGraph(attributePaths = { "product", "color" })
	@Query("""
			select v from ProductVariant v
			where v.active = true and v.stock <= :threshold
			  and v.product.status <> com.tukfit.catalog.ProductStatus.HIDDEN
			order by v.stock asc, v.id asc
			""")
	List<ProductVariant> findLowStock(@Param("threshold") int threshold, org.springframework.data.domain.Pageable pageable);

	@Query(value = "SELECT EXISTS (SELECT 1 FROM order_items WHERE variant_id = :id)", nativeQuery = true)
	boolean isOrdered(@Param("id") Long id);

	@Query(value = "SELECT EXISTS (SELECT 1 FROM order_items oi JOIN product_variants v ON v.id = oi.variant_id WHERE v.color_id = :colorId)",
			nativeQuery = true)
	boolean isColorOrdered(@Param("colorId") Long colorId);

	@Query(value = "SELECT EXISTS (SELECT 1 FROM order_items WHERE product_id = :productId)", nativeQuery = true)
	boolean isProductOrdered(@Param("productId") Long productId);
}
