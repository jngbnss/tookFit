package com.tukfit.order;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

/** 30분 안에 결제하지 않은 주문을 EXPIRED로 바꾼다. 재고는 결제 때 줄이므로 되돌릴 것이 없다. */
@Component
public class OrderExpiryScheduler {

	static final Duration PAYMENT_WINDOW = Duration.ofMinutes(30);
	private static final Logger log = LoggerFactory.getLogger(OrderExpiryScheduler.class);

	private final OrderRepository orders;
	private final TransactionTemplate tx;

	public OrderExpiryScheduler(OrderRepository orders, TransactionTemplate tx) {
		this.orders = orders;
		this.tx = tx;
	}

	@Scheduled(fixedDelay = 60_000, initialDelay = 30_000)
	public void expire() {
		List<Long> ids = orders.findExpiredIds(Instant.now().minus(PAYMENT_WINDOW));
		for (Long id : ids) {
			tx.executeWithoutResult(status -> orders.findByIdForUpdate(id)
				.filter(o -> o.getStatus() == OrderStatus.PENDING_PAYMENT)
				.ifPresent(o -> o.changeStatus(OrderStatus.EXPIRED, null, "결제 기한 초과")));
		}
		if (!ids.isEmpty()) {
			log.info("결제 기한이 지난 주문 {}건을 만료 처리했어요.", ids.size());
		}
	}
}
