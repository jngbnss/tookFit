package com.tukfit.cart;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

	@EntityGraph(attributePaths = { "variant", "variant.product", "variant.color" })
	List<CartItem> findByUserIdOrderByIdDesc(Long userId);

	Optional<CartItem> findByIdAndUserId(Long id, Long userId);

	Optional<CartItem> findByUserIdAndVariantId(Long userId, Long variantId);

	@Modifying
	@Query("delete from CartItem c where c.userId = :userId")
	void deleteByUserId(@Param("userId") Long userId);

	@Modifying
	@Query("delete from CartItem c where c.userId = :userId and c.variant.id in :variantIds")
	void deleteByUserIdAndVariantIds(@Param("userId") Long userId, @Param("variantIds") Collection<Long> variantIds);
}
