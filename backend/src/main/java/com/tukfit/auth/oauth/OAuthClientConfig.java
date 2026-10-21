package com.tukfit.auth.oauth;

import java.util.ArrayList;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;

import com.tukfit.global.config.AppProperties;

/**
 * 카카오·네이버 OAuth 클라이언트. 환경변수로 client id가 들어온 provider만 등록한다.
 * 하나도 없으면 소셜 로그인은 꺼진 상태로 서버가 뜬다.
 */
@Configuration
public class OAuthClientConfig {

	private static final String REDIRECT_URI = "{baseUrl}/login/oauth2/code/{registrationId}";

	@Bean
	SocialClients socialClients(AppProperties props) {
		List<ClientRegistration> registrations = new ArrayList<>();
		AppProperties.OAuth oauth = props.oauth();
		if (oauth != null && oauth.kakao() != null && oauth.kakao().configured()) {
			registrations.add(kakao(oauth.kakao()));
		}
		if (oauth != null && oauth.naver() != null && oauth.naver().configured()) {
			registrations.add(naver(oauth.naver()));
		}
		return new SocialClients(registrations);
	}

	private ClientRegistration kakao(AppProperties.Client client) {
		return ClientRegistration.withRegistrationId("kakao")
				.clientId(client.clientId())
				.clientSecret(client.clientSecret())
				.clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
				.authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
				.redirectUri(REDIRECT_URI)
				// 이메일(account_email)은 카카오 비즈 앱 검수 후 추가할 수 있다.
				.scope("profile_nickname")
				.authorizationUri("https://kauth.kakao.com/oauth/authorize")
				.tokenUri("https://kauth.kakao.com/oauth/token")
				.userInfoUri("https://kapi.kakao.com/v2/user/me")
				.userNameAttributeName("id")
				.clientName("Kakao")
				.build();
	}

	private ClientRegistration naver(AppProperties.Client client) {
		return ClientRegistration.withRegistrationId("naver")
				.clientId(client.clientId())
				.clientSecret(client.clientSecret())
				.clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
				.authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
				.redirectUri(REDIRECT_URI)
				.scope("name", "email", "mobile")
				.authorizationUri("https://nid.naver.com/oauth2.0/authorize")
				.tokenUri("https://nid.naver.com/oauth2.0/token")
				.userInfoUri("https://openapi.naver.com/v1/nid/me")
				.userNameAttributeName("response")
				.clientName("Naver")
				.build();
	}
}
