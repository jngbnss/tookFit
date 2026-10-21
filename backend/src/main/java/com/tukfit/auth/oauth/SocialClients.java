package com.tukfit.auth.oauth;

import java.util.List;

import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;

import com.tukfit.user.SocialProvider;

/** 설정된 소셜 로그인 클라이언트 목록. 비어 있을 수 있다. */
public record SocialClients(List<ClientRegistration> registrations) {

	public boolean isEmpty() {
		return registrations.isEmpty();
	}

	public InMemoryClientRegistrationRepository repository() {
		return new InMemoryClientRegistrationRepository(registrations);
	}

	public List<SocialProvider> providers() {
		return registrations.stream()
				.map(r -> SocialProvider.valueOf(r.getRegistrationId().toUpperCase()))
				.toList();
	}
}
