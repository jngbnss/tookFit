package com.tukfit.review;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<Review, Long> {

	Page<Review> findByProductIdAndStatus(Long productId, ReviewStatus status, Pageable pageable);

	Page<Review> findByUserId(Long userId, Pageable pageable);

	Optional<Review> findByIdAndUserId(Long id, Long userId);

	boolean existsByOrderItemId(Long orderItemId);

	List<Review> findByOrderItemIdIn(Collection<Long> orderItemIds);

	/** [productId, 평균, 개수] */
	@Query("""
			select r.productId, avg(r.rating), count(r) from Review r
			where r.status = com.tukfit.review.ReviewStatus.VISIBLE and r.productId in :ids
			group by r.productId
			""")
	List<Object[]> ratingStats(@Param("ids") Collection<Long> productIds);

	/** [평점, 개수] */
	@Query("""
			select r.rating, count(r) from Review r
			where r.status = com.tukfit.review.ReviewStatus.VISIBLE and r.productId = :productId
			group by r.rating
			""")
	List<Object[]> distribution(@Param("productId") Long productId);

	@Query("""
			select r from Review r
			where (:status is null or r.status = :status) and (:rating is null or r.rating = :rating)
			""")
	Page<Review> search(@Param("status") ReviewStatus status, @Param("rating") Short rating, Pageable pageable);
}
