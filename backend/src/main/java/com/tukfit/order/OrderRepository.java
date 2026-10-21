package com.tukfit.order;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

	Optional<Order> findByOrderNumber(String orderNumber);

	Optional<Order> findByOrderNumberAndUserId(String orderNumber, Long userId);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select o from Order o where o.orderNumber = :orderNumber")
	Optional<Order> findForUpdate(@Param("orderNumber") String orderNumber);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select o from Order o where o.id = :id")
	Optional<Order> findByIdForUpdate(@Param("id") Long id);

	boolean existsByOrderNumber(String orderNumber);

	Page<Order> findByUserIdAndStatusNot(Long userId, OrderStatus status, Pageable pageable);

	boolean existsByUserIdAndStatusIn(Long userId, Collection<OrderStatus> statuses);

	long countByUserIdAndCouponIdAndStatusIn(Long userId, Long couponId, Collection<OrderStatus> statuses);

	@Query("select o.id from Order o where o.status = com.tukfit.order.OrderStatus.PENDING_PAYMENT and o.createdAt < :before")
	List<Long> findExpiredIds(@Param("before") Instant before);


	@Query("""
			select o from Order o
			where (:status is null or o.status = :status) and o.createdAt >= :from and o.createdAt < :to
			order by o.createdAt asc
			""")
	List<Order> findForExport(@Param("status") OrderStatus status, @Param("from") Instant from,
			@Param("to") Instant to);

	/** [주문 수, 매출 합계] — 결제된 주문(취소 제외) 기준 */
	@Query("""
			select count(o), coalesce(sum(o.total), 0) from Order o
			where o.paidAt >= :from and o.paidAt < :to and o.status <> com.tukfit.order.OrderStatus.CANCELLED
			""")
	List<Object[]> salesBetween(@Param("from") Instant from, @Param("to") Instant to);

	@Query("select o.status, count(o) from Order o group by o.status")
	List<Object[]> countByStatus();

	@Query("select count(o) from Order o where o.userId = :userId and o.status <> com.tukfit.order.OrderStatus.PENDING_PAYMENT and o.status <> com.tukfit.order.OrderStatus.EXPIRED")
	long countPlaced(@Param("userId") Long userId);

	@Query("select coalesce(sum(o.total), 0) from Order o where o.userId = :userId and o.status in (com.tukfit.order.OrderStatus.PAID, com.tukfit.order.OrderStatus.PREPARING, com.tukfit.order.OrderStatus.SHIPPED, com.tukfit.order.OrderStatus.DELIVERED)")
	long totalSpent(@Param("userId") Long userId);
}
