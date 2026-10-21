package com.tukfit.payment;

import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import com.tukfit.global.config.AppProperties;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * 토스페이먼츠 결제 API (https://docs.tosspayments.com/reference).
 * 시크릿 키는 Basic 인증 사용자명으로 쓰고 비밀번호는 비운다.
 */
@Component
public class TossPaymentGateway implements PaymentGateway {

	private final AppProperties.Toss toss;
	private final RestClient client;
	private final JsonMapper mapper;

	public TossPaymentGateway(AppProperties props, RestClient.Builder builder, JsonMapper mapper) {
		this.toss = props.payment() != null && props.payment().toss() != null ? props.payment().toss()
				: new AppProperties.Toss(null, null, "https://api.tosspayments.com");
		this.mapper = mapper;
		String secret = toss.secretKey() == null ? "" : toss.secretKey();
		String basic = Base64.getEncoder().encodeToString((secret + ":").getBytes(StandardCharsets.UTF_8));
		this.client = builder.clone()
				.baseUrl(toss.apiBase())
				.defaultHeader("Authorization", "Basic " + basic)
				.build();
	}

	public boolean configured() {
		return toss.secretKey() != null && !toss.secretKey().isBlank() && toss.clientKey() != null
				&& !toss.clientKey().isBlank();
	}

	@Override
	public PaymentProvider provider() {
		return PaymentProvider.TOSS;
	}

	@Override
	public String clientKey() {
		return toss.clientKey();
	}

	@Override
	public Result confirm(String paymentKey, String orderNumber, long amount) {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("paymentKey", paymentKey);
		body.put("orderId", orderNumber);
		body.put("amount", amount);
		return call("POST", "/v1/payments/confirm", body, "confirm-" + paymentKey);
	}

	@Override
	public Result cancel(String paymentKey, long amount, String reason, String idempotencyKey) {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("cancelReason", reason == null || reason.isBlank() ? "고객 요청" : reason);
		body.put("cancelAmount", amount);
		return call("POST", "/v1/payments/" + paymentKey + "/cancel", body, idempotencyKey);
	}

	@Override
	public Result fetch(String paymentKey) {
		return call("GET", "/v1/payments/" + paymentKey, null, null);
	}

	private Result call(String method, String path, Object body, String idempotencyKey) {
		if (!configured()) {
			throw new PaymentGatewayException("NOT_CONFIGURED", "토스페이먼츠 키가 설정되지 않았어요.");
		}
		try {
			RestClient.RequestBodySpec spec = client.method(org.springframework.http.HttpMethod.valueOf(method))
					.uri(path)
					.contentType(MediaType.APPLICATION_JSON);
			if (idempotencyKey != null) {
				spec.header("Idempotency-Key", idempotencyKey);
			}
			if (body != null) {
				spec.body(body);
			}
			String raw = spec.retrieve()
					.onStatus(HttpStatusCode::isError, (req, res) -> {
						JsonNode error = mapper.readTree(res.getBody());
						throw new PaymentGatewayException(error.path("code").asString("PG_ERROR"),
								error.path("message").asString("결제 처리 중 오류가 발생했어요."));
					})
					.body(String.class);
			return parse(raw);
		}
		catch (ResourceAccessException e) {
			throw new PaymentGatewayException("PG_UNREACHABLE", "결제사와 통신하지 못했어요.", e);
		}
	}

	private Result parse(String raw) {
		JsonNode node = mapper.readTree(raw);
		long total = node.path("totalAmount").asLong();
		long balance = node.path("balanceAmount").asLong(total);
		String approvedAt = node.path("approvedAt").asString(null);
		return new Result(node.path("paymentKey").asString(), node.path("orderId").asString(), total, total - balance,
				mapStatus(node.path("status").asString()), node.path("method").asString(null),
				approvedAt == null ? null : OffsetDateTime.parse(approvedAt).toInstant(), raw);
	}

	private static Status mapStatus(String status) {
		return switch (status) {
			case "DONE" -> Status.PAID;
			case "CANCELED" -> Status.CANCELLED;
			case "PARTIAL_CANCELED" -> Status.PARTIAL_CANCELLED;
			case "ABORTED", "EXPIRED" -> Status.FAILED;
			default -> Status.READY;
		};
	}

}
