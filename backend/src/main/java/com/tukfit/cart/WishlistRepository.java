package com.tukfit.cart;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

	List<Wishlist> findByUserIdOrderByIdDesc(Long userId);

	boolean existsByUserIdAndProductId(Long userId, Long productId);

	@Modifying
	@Query("delete from Wishlist w where w.userId = :userId and w.productId = :productId")
	void deleteByUserIdAndProductId(@Param("userId") Long userId, @Param("productId") Long productId);
}
