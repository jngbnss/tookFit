package com.tukfit;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;

import com.tukfit.support.ApiClient;
import com.tukfit.support.IntegrationTest;

class AuthIntegrationTest extends IntegrationTest {

	@Test
	void signupIssuesHttpOnlyCookiesAndMeWorks() {
		ApiClient api = client();
		String email = fixtures.uniqueEmail();
		var response = api.post("/api/v1/auth/signup", Map.of("email", email, "password", "abc12345", "name", "홍길동",
				"agreeTerms", true, "agreePrivacy", true, "agreeMarketing", false)).expect(201);
		assertThat(response.json().path("email").asString()).isEqualTo(email);
		assertThat(response.raw().headers().allValues("set-cookie"))
			.anyMatch(c -> c.startsWith("access_token=") && c.contains("HttpOnly") && c.contains("SameSite=Lax"))
			.anyMatch(c -> c.startsWith("refresh_token=") && c.contains("Path=/api/v1/auth"));

		assertThat(api.get("/api/v1/me").expectJson(200).path("name").asString()).isEqualTo("홍길동");
		api.post("/api/v1/auth/signup", Map.of("email", email, "password", "abc12345", "name", "x", "agreeTerms", true,
				"agreePrivacy", true, "agreeMarketing", false)).expectError(409, "EMAIL_DUPLICATED");
	}

	@Test
	void signupValidatesPasswordAndAgreements() {
		var body = client().post("/api/v1/auth/signup", Map.of("email", fixtures.uniqueEmail(), "password", "short",
				"name", "a", "agreeTerms", false, "agreePrivacy", true, "agreeMarketing", false))
			.expectError(400, "VALIDATION_FAILED").json();
		assertThat(body.path("fields").has("password")).isTrue();
		assertThat(body.path("fields").has("agreeTerms")).isTrue();
	}

	@Test
	void mutatingRequestWithoutCsrfIsRejected() {
		ApiClient api = client().withoutCsrf();
		api.post("/api/v1/auth/login", Map.of("email", "x@x.com", "password", "y")).expectError(403, "CSRF_INVALID");
	}

	@Test
	void wrongPasswordIsUnauthorized() {
		String email = fixtures.uniqueEmail();
		fixtures.user(email, "password123", com.tukfit.user.Role.USER);
		client().post("/api/v1/auth/login", Map.of("email", email, "password", "nope12345"))
			.expectError(401, "INVALID_CREDENTIALS");
	}

	@Test
	void refreshRotatesTokenAndOldTokenIsRejected() {
		ApiClient api = newUser();
		String oldRefresh = api.cookie("refresh_token");
		api.post("/api/v1/auth/refresh", null).expect(204);
		String newRefresh = api.cookie("refresh_token");
		assertThat(newRefresh).isNotBlank().isNotEqualTo(oldRefresh);
		api.get("/api/v1/me").expect(200);

		ApiClient stolen = client();
		stolen.setCookie("refresh_token", oldRefresh);
		stolen.post("/api/v1/auth/refresh", null).expectError(401, "UNAUTHORIZED");
	}

	@Test
	void logoutRevokesRefreshAndClearsCookies() {
		ApiClient api = newUser();
		String refresh = api.cookie("refresh_token");
		api.post("/api/v1/auth/logout", null).expect(204);
		api.get("/api/v1/me").expectError(401, "UNAUTHORIZED");

		ApiClient replay = client();
		replay.setCookie("refresh_token", refresh);
		replay.post("/api/v1/auth/refresh", null).expect(401);
	}

	@Test
	void expiredOrMissingTokenReturnsJson401() {
		ApiClient api = client();
		api.setCookie("access_token", "garbage");
		api.get("/api/v1/me").expectError(401, "UNAUTHORIZED");
	}
}
