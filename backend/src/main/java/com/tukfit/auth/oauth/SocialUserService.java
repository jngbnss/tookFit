package com.tukfit.auth.oauth;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tukfit.user.Role;
import com.tukfit.user.SocialProvider;
import com.tukfit.user.User;
import com.tukfit.user.UserRepository;

/**
 * 소셜 프로필로 회원을 찾거나 새로 만든다.
 * 같은 이메일의 기존 회원과 자동으로 합치지 않는다 (이메일 검증 여부를 믿을 수 없어 계정 탈취 위험).
 */
@Service
public class SocialUserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

	public static final String USER_ID_ATTRIBUTE = "tukfitUserId";

	private final DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();
	private final UserRepository users;

	public SocialUserService(UserRepository users) {
		this.users = users;
	}

	@Override
	@Transactional
	public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
		OAuth2User remote = delegate.loadUser(request);
		SocialProvider provider = SocialProvider.valueOf(request.getClientRegistration().getRegistrationId().toUpperCase());
		Profile profile = switch (provider) {
			case KAKAO -> kakao(remote.getAttributes());
			case NAVER -> naver(remote.getAttributes());
		};
		if (profile.id() == null) {
			throw new OAuth2AuthenticationException(new OAuth2Error("invalid_profile"));
		}

		User user = users.findBySocial(provider, profile.id()).orElseGet(() -> {
			String email = profile.email() != null && !users.existsByEmailIgnoreCase(profile.email())
					? profile.email() : null;
			String name = profile.name() != null && !profile.name().isBlank() ? profile.name() : "회원";
			User created = new User(email, null, truncate(name, 50), normalizePhone(profile.phone()), Role.USER, false);
			created.linkSocial(provider, profile.id());
			return users.save(created);
		});
		if (!user.isActive()) {
			throw new OAuth2AuthenticationException(new OAuth2Error("withdrawn"));
		}
		user.recordLogin();

		Map<String, Object> attributes = new HashMap<>();
		attributes.put("sub", provider.name() + ":" + profile.id());
		attributes.put(USER_ID_ATTRIBUTE, user.getId());
		return new DefaultOAuth2User(List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())), attributes,
				"sub");
	}

	@SuppressWarnings("unchecked")
	private Profile kakao(Map<String, Object> attrs) {
		Object id = attrs.get("id");
		Map<String, Object> account = (Map<String, Object>) attrs.getOrDefault("kakao_account", Map.of());
		Map<String, Object> profile = (Map<String, Object>) account.getOrDefault("profile", Map.of());
		Map<String, Object> properties = (Map<String, Object>) attrs.getOrDefault("properties", Map.of());
		String name = (String) profile.getOrDefault("nickname", properties.get("nickname"));
		String email = Boolean.TRUE.equals(account.get("is_email_verified")) ? (String) account.get("email") : null;
		return new Profile(id == null ? null : id.toString(), email, name, (String) account.get("phone_number"));
	}

	@SuppressWarnings("unchecked")
	private Profile naver(Map<String, Object> attrs) {
		Map<String, Object> response = (Map<String, Object>) attrs.getOrDefault("response", Map.of());
		return new Profile((String) response.get("id"), (String) response.get("email"), (String) response.get("name"),
				(String) response.get("mobile"));
	}

	private static String normalizePhone(String phone) {
		if (phone == null) {
			return null;
		}
		String digits = phone.replaceAll("[^0-9+]", "");
		if (digits.startsWith("+82")) {
			digits = "0" + digits.substring(3);
		}
		return truncate(digits, 20);
	}

	private static String truncate(String value, int max) {
		return value == null || value.length() <= max ? value : value.substring(0, max);
	}

	private record Profile(String id, String email, String name, String phone) {
	}
}
