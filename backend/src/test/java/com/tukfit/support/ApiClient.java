package com.tukfit.support;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.HttpCookie;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** 쿠키를 기억하고 XSRF-TOKEN을 헤더로 보내는, 브라우저처럼 동작하는 테스트용 HTTP 클라이언트. */
public class ApiClient {

	private static final JsonMapper MAPPER = JsonMapper.builder().build();

	private final String baseUrl;
	private final CookieManager cookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
	private final HttpClient http;
	private boolean sendCsrf = true;

	public ApiClient(String baseUrl) {
		this.baseUrl = baseUrl;
		this.http = HttpClient.newBuilder().cookieHandler(cookies).followRedirects(HttpClient.Redirect.NEVER).build();
	}

	public ApiClient withoutCsrf() {
		this.sendCsrf = false;
		return this;
	}

	public Response get(String path) {
		return send("GET", path, null);
	}

	public Response post(String path, Object body) {
		return send("POST", path, body);
	}

	public Response put(String path, Object body) {
		return send("PUT", path, body);
	}

	public Response patch(String path, Object body) {
		return send("PATCH", path, body);
	}

	public Response delete(String path) {
		return send("DELETE", path, null);
	}

	public String cookie(String name) {
		return cookies.getCookieStore().getCookies().stream().filter(c -> c.getName().equals(name))
				.map(HttpCookie::getValue).findFirst().orElse(null);
	}

	public void setCookie(String name, String value) {
		cookies.getCookieStore().getCookies().stream().filter(c -> c.getName().equals(name)).toList()
				.forEach(c -> cookies.getCookieStore().remove(URI.create(baseUrl), c));
		HttpCookie cookie = new HttpCookie(name, value);
		cookie.setPath(name.equals("refresh_token") ? "/api/v1/auth" : "/");
		cookie.setVersion(0);
		cookies.getCookieStore().add(URI.create(baseUrl), cookie);
	}

	private Response send(String method, String path, Object body) {
		try {
			HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(baseUrl + path))
					.header("Content-Type", "application/json");
			String xsrf = cookie("XSRF-TOKEN");
			if (sendCsrf && xsrf != null && !method.equals("GET")) {
				builder.header("X-XSRF-TOKEN", xsrf);
			}
			HttpRequest.BodyPublisher publisher = body == null ? HttpRequest.BodyPublishers.noBody()
					: HttpRequest.BodyPublishers.ofString(MAPPER.writeValueAsString(body));
			HttpResponse<String> response = http.send(builder.method(method, publisher).build(),
					HttpResponse.BodyHandlers.ofString());
			return new Response(response);
		}
		catch (IOException | InterruptedException e) {
			throw new IllegalStateException(e);
		}
	}

	public static class Response {

		private final HttpResponse<String> raw;

		Response(HttpResponse<String> raw) {
			this.raw = raw;
		}

		public int status() {
			return raw.statusCode();
		}

		public String body() {
			return raw.body();
		}

		public HttpResponse<String> raw() {
			return raw;
		}

		public JsonNode json() {
			return MAPPER.readTree(raw.body());
		}

		public Response expect(int status) {
			assertThat(raw.statusCode()).as("%s %s → %s", raw.request().method(), raw.uri(), raw.body())
					.isEqualTo(status);
			return this;
		}

		public JsonNode expectJson(int status) {
			return expect(status).json();
		}

		public Response expectError(int status, String code) {
			expect(status);
			assertThat(json().path("code").asString()).isEqualTo(code);
			return this;
		}
	}
}
