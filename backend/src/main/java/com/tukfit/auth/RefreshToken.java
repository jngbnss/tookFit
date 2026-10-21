package com.tukfit.auth;

import java.time.Instant;

import com.tukfit.global.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "refresh_tokens")
public class RefreshToken extends BaseEntity {

	@Column(name = "user_id", nullable = false)
	private Long userId;

	private String tokenHash;
	private Instant expiresAt;
	private Instant revokedAt;

	protected RefreshToken() {
	}

	public RefreshToken(Long userId, String tokenHash, Instant expiresAt) {
		this.userId = userId;
		this.tokenHash = tokenHash;
		this.expiresAt = expiresAt;
	}

	public boolean isUsable() {
		return revokedAt == null && expiresAt.isAfter(Instant.now());
	}

	public void revoke() {
		if (revokedAt == null) {
			revokedAt = Instant.now();
		}
	}

	public Long getUserId() {
		return userId;
	}

	public Instant getRevokedAt() {
		return revokedAt;
	}
}
