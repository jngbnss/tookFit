package com.tukfit.support;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.tukfit.TestcontainersConfiguration;

/** 실제 서버(랜덤 포트)와 Testcontainers PostgreSQL로 HTTP 요청을 보내는 통합 테스트 기반. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import({ TestcontainersConfiguration.class, Fixtures.class })
@ActiveProfiles("test")
public abstract class IntegrationTest {

	@LocalServerPort
	protected int port;

	@Autowired
	protected Fixtures fixtures;

	/** CSRF 토큰을 받아 둔 새 브라우저 세션 */
	protected ApiClient client() {
		ApiClient client = new ApiClient("http://localhost:" + port);
		client.get("/api/v1/auth/csrf").expect(204);
		return client;
	}

	protected ApiClient loggedIn(String email, String password) {
		ApiClient client = client();
		client.post("/api/v1/auth/login", java.util.Map.of("email", email, "password", password)).expect(200);
		return client;
	}

	protected ApiClient newUser() {
		String email = fixtures.uniqueEmail();
		fixtures.user(email, "password123", com.tukfit.user.Role.USER);
		return loggedIn(email, "password123");
	}

	protected ApiClient newAdmin() {
		String email = fixtures.uniqueEmail();
		fixtures.user(email, "password123", com.tukfit.user.Role.ADMIN);
		return loggedIn(email, "password123");
	}
}
