package com.tukfit.payment;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

	List<Payment> findByOrderIdOrderByIdAsc(Long orderId);

	List<Payment> findByOrderIdIn(Collection<Long> orderIds);

	Optional<Payment> findByPgPaymentKey(String pgPaymentKey);
}
