package com.tukfit.payment;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

import com.tukfit.global.config.AppProperties;

/** 설정(PAYMENT_PROVIDER)에 따라 지금 쓸 PG를 고르고, 기존 결제는 저장된 provider로 찾는다. */
@Component
public class PaymentGateways {

	private static final Logger log = LoggerFactory.getLogger(PaymentGateways.class);

	private final List<PaymentGateway> gateways;
	private final PaymentGateway active;

	public PaymentGateways(List<PaymentGateway> gateways, AppProperties props, TossPaymentGateway toss,
			Environment env) {
		this.gateways = gateways;
		PaymentProvider wanted = PaymentProvider.valueOf(
				props.payment() == null ? "MOCK" : props.payment().provider().trim().toUpperCase());
		if (wanted == PaymentProvider.TOSS && !toss.configured()) {
			throw new IllegalStateException("PAYMENT_PROVIDER=TOSS 이지만 TOSS_CLIENT_KEY/TOSS_SECRET_KEY가 비어 있어요.");
		}
		this.active = get(wanted);
		if (wanted == PaymentProvider.MOCK && !env.acceptsProfiles(Profiles.of("dev", "test"))) {
			log.warn("⚠ 모의 결제(MOCK)로 실행 중입니다. 실제 결제를 받으려면 PAYMENT_PROVIDER=TOSS와 키를 설정하세요.");
		}
	}

	public PaymentGateway active() {
		return active;
	}

	public PaymentGateway get(PaymentProvider provider) {
		return gateways.stream().filter(g -> g.provider() == provider).findFirst()
				.orElseThrow(() -> new IllegalStateException("No gateway for " + provider));
	}
}
