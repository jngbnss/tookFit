package com.tukfit.global.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.savedrequest.NullRequestCache;

import com.tukfit.auth.JwtAuthenticationFilter;
import com.tukfit.auth.JwtService;
import com.tukfit.auth.oauth.OAuthLoginHandlers;
import com.tukfit.auth.oauth.OAuthRedirectCookieFilter;
import com.tukfit.auth.oauth.SocialClients;
import com.tukfit.auth.oauth.SocialUserService;
import com.tukfit.global.config.AppProperties;

@Configuration
public class SecurityConfig {

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http, JwtService jwtService, JsonSecurityHandlers handlers,
			SocialClients socialClients, SocialUserService socialUserService, OAuthLoginHandlers oauthHandlers,
			AppProperties props, @Value("${app.docs-public:false}") boolean docsPublic) throws Exception {

		CookieCsrfTokenRepository csrfRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
		csrfRepository.setCookieCustomizer(cookie -> cookie.secure(props.cookie().secure()).sameSite("Lax"));
		csrfRepository.setCookiePath("/");

		http
			.csrf(csrf -> csrf
				.spa()
				.csrfTokenRepository(csrfRepository)
				.ignoringRequestMatchers("/api/v1/payments/webhook/**"))
			.cors(AbstractHttpConfigurer::disable)
			.formLogin(AbstractHttpConfigurer::disable)
			.httpBasic(AbstractHttpConfigurer::disable)
			.logout(AbstractHttpConfigurer::disable)
			.requestCache(cache -> cache.requestCache(new NullRequestCache()))
			.exceptionHandling(e -> e.authenticationEntryPoint(handlers).accessDeniedHandler(handlers))
			.addFilterBefore(new JwtAuthenticationFilter(jwtService), UsernamePasswordAuthenticationFilter.class)
			.authorizeHttpRequests(auth -> {
				auth.requestMatchers("/actuator/health", "/actuator/health/**").permitAll();
				auth.requestMatchers("/actuator/**").denyAll();
				if (docsPublic) {
					auth.requestMatchers("/api/v1/docs/**", "/api/v1/docs", "/api/v1/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui/**")
						.permitAll();
				}
				else {
					auth.requestMatchers("/api/v1/docs/**", "/api/v1/docs", "/api/v1/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui/**")
						.hasRole("ADMIN");
				}
				auth.requestMatchers("/api/v1/admin/**").hasRole("ADMIN");
				auth.requestMatchers("/api/v1/auth/**", "/api/v1/payments/webhook/**").permitAll();
				auth.requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll();
				auth.requestMatchers(HttpMethod.GET, "/api/v1/categories", "/api/v1/products", "/api/v1/products/**",
						"/api/v1/banners", "/api/v1/notices", "/api/v1/notices/**", "/api/v1/store/**").permitAll();
				auth.requestMatchers("/api/**").authenticated();
				auth.anyRequest().denyAll();
			});

		if (!socialClients.isEmpty()) {
			http.addFilterBefore(new OAuthRedirectCookieFilter(props.cookie().secure()),
					OAuth2AuthorizationRequestRedirectFilter.class);
			http.oauth2Login(oauth -> oauth
				.clientRegistrationRepository(socialClients.repository())
				.userInfoEndpoint(user -> user.userService(socialUserService))
				.successHandler(oauthHandlers)
				.failureHandler(oauthHandlers));
		}
		return http.build();
	}
}
