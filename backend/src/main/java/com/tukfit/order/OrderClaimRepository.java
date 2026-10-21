package com.tukfit.order;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface OrderClaimRepository extends JpaRepository<OrderClaim, Long> {

	@Query("select c from OrderClaim c where c.orderItem.order.id = :orderId order by c.id")
	List<OrderClaim> findByOrderId(@Param("orderId") Long orderId);

	@Query("select coalesce(sum(c.quantity), 0) from OrderClaim c where c.orderItem.id = :itemId and c.status <> com.tukfit.order.ClaimStatus.REJECTED")
	int claimedQuantity(@Param("itemId") Long orderItemId);

	@EntityGraph(attributePaths = { "orderItem", "orderItem.order" })
	@Query("select c from OrderClaim c where (:status is null or c.status = :status)")
	Page<OrderClaim> search(@Param("status") ClaimStatus status, Pageable pageable);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select c from OrderClaim c join fetch c.orderItem i join fetch i.order where c.id = :id")
	Optional<OrderClaim> findForUpdate(@Param("id") Long id);

	long countByStatus(ClaimStatus status);
}
