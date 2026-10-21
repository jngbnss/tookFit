package com.tukfit.order;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

	@Query("select i from OrderItem i join fetch i.order o where i.id = :id and o.userId = :userId")
	Optional<OrderItem> findOwned(@Param("id") Long id, @Param("userId") Long userId);

	/** 배송 완료됐고 아직 리뷰가 없는 주문 상품 */
	@Query("""
			select i from OrderItem i join fetch i.order o
			where o.userId = :userId and o.status = com.tukfit.order.OrderStatus.DELIVERED
			  and not exists (select r.id from Review r where r.orderItemId = i.id)
			order by o.createdAt desc, i.id asc
			""")
	List<OrderItem> findReviewable(@Param("userId") Long userId);
}
