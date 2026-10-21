package com.tukfit.coupon;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

	Optional<Coupon> findByCodeIgnoreCase(String code);

	boolean existsByCodeIgnoreCase(String code);

	boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);

	/** 사용 한도 안에서만 사용 횟수를 늘린다. 한도를 넘으면 0. */
	@Modifying(flushAutomatically = true)
	@Query(value = "UPDATE coupons SET used_count = used_count + 1, updated_at = now() WHERE id = :id AND (usage_limit IS NULL OR used_count < usage_limit)",
			nativeQuery = true)
	int increaseUsage(@Param("id") Long id);

	@Modifying(flushAutomatically = true)
	@Query(value = "UPDATE coupons SET used_count = GREATEST(used_count - 1, 0), updated_at = now() WHERE id = :id",
			nativeQuery = true)
	int decreaseUsage(@Param("id") Long id);
}
