package com.tukfit.auth;

import java.nio.charset.StandardCharsets;
import java.time.Instant;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidationException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.stereotype.Service;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.tukfit.global.config.AppProperties;
import com.tukfit.user.Role;

/** 15분짜리 access token(HS256)을 발급하고 검증한다. */
@Service
public class JwtService {

	private static final String ISSUER = "tukfit";

	private final JwtEncoder encoder;
	private final JwtDecoder decoder;
	private final AppProperties props;

	public JwtService(AppProperties props) {
		this.props = props;
		String secret = props.jwt().secret();
		if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
			throw new IllegalStateException("JWT_SECRET must be at least 32 bytes");
		}
		SecretKey key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
		this.encoder = new NimbusJwtEncoder(new ImmutableSecret<>(key));
		this.decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
	}

	public String issue(Long userId, Role role) {
		Instant now = Instant.now();
		JwtClaimsSet claims = JwtClaimsSet.builder()
				.issuer(ISSUER)
				.subject(userId.toString())
				.issuedAt(now)
				.expiresAt(now.plus(props.jwt().accessTtl()))
				.claim("role", role.name())
				.build();
		JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
		return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
	}

	/** 토큰을 검증한다. 만료됐으면 {@link ExpiredTokenException}, 그 밖의 오류는 {@link JwtException}. */
	public AuthUser verify(String token) {
		try {
			Jwt jwt = decoder.decode(token);
			return new AuthUser(Long.valueOf(jwt.getSubject()), Role.valueOf(jwt.getClaimAsString("role")));
		}
		catch (JwtValidationException e) {
			boolean expired = e.getErrors().stream().anyMatch(err -> err.getDescription().contains("expired"));
			if (expired) {
				throw new ExpiredTokenException();
			}
			throw e;
		}
	}

	public static class ExpiredTokenException extends RuntimeException {
	}
}
