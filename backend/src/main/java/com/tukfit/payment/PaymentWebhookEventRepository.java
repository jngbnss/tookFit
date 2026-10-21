package com.tukfit.payment;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentWebhookEventRepository extends JpaRepository<PaymentWebhookEvent, Long> {

	boolean existsByProviderAndEventKey(PaymentProvider provider, String eventKey);
}
