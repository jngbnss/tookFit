package com.tukfit.auth;

import java.time.Instant;

import com.tukfit.global.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken extends BaseEntity {

	@Column(name = "user_id", nullable = false)
	private Long userId;

	private String tokenHash;
	private Instant expiresAt;
	private Instant usedAt;

	protected PasswordResetToken() {
	}

	public PasswordResetToken(Long userId, String tokenHash, Instant expiresAt) {
		this.userId = userId;
		this.tokenHash = tokenHash;
		this.expiresAt = expiresAt;
	}

	public boolean isUsable() {
		return usedAt == null && expiresAt.isAfter(Instant.now());
	}

	public void use() {
		usedAt = Instant.now();
	}

	public Long getUserId() {
		return userId;
	}
}
