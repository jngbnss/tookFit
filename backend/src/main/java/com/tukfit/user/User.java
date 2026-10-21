package com.tukfit.user;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import com.tukfit.global.entity.BaseEntity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User extends BaseEntity {

	private String email;
	private String passwordHash;
	private String name;
	private String phone;

	@Enumerated(EnumType.STRING)
	private Role role;

	@Enumerated(EnumType.STRING)
	private UserStatus status;

	private boolean marketingAgreed;
	private Instant lastLoginAt;
	private Instant withdrawnAt;

	@OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<SocialAccount> socialAccounts = new ArrayList<>();

	protected User() {
	}

	public User(String email, String passwordHash, String name, String phone, Role role, boolean marketingAgreed) {
		this.email = email;
		this.passwordHash = passwordHash;
		this.name = name;
		this.phone = phone;
		this.role = role;
		this.status = UserStatus.ACTIVE;
		this.marketingAgreed = marketingAgreed;
	}

	public void linkSocial(SocialProvider provider, String providerUserId) {
		socialAccounts.add(new SocialAccount(this, provider, providerUserId));
	}

	public void updateProfile(String name, String phone, Boolean marketingAgreed) {
		if (name != null) {
			this.name = name;
		}
		if (phone != null) {
			this.phone = phone.isBlank() ? null : phone;
		}
		if (marketingAgreed != null) {
			this.marketingAgreed = marketingAgreed;
		}
	}

	public void changePassword(String passwordHash) {
		this.passwordHash = passwordHash;
	}

	public void changeRole(Role role) {
		this.role = role;
	}

	public void recordLogin() {
		this.lastLoginAt = Instant.now();
	}

	public void fillEmailIfEmpty(String email) {
		if (this.email == null && email != null && !email.isBlank()) {
			this.email = email;
		}
	}

	/** 탈퇴 시 개인정보를 지우고 식별 불가능하게 만든다. 주문 기록은 스냅샷으로 남는다. */
	public void withdraw() {
		this.status = UserStatus.WITHDRAWN;
		this.withdrawnAt = Instant.now();
		this.email = null;
		this.passwordHash = null;
		this.phone = null;
		this.name = "탈퇴회원";
		this.marketingAgreed = false;
		this.socialAccounts.clear();
	}

	public boolean isActive() {
		return status == UserStatus.ACTIVE;
	}

	public String getEmail() {
		return email;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public String getName() {
		return name;
	}

	public String getPhone() {
		return phone;
	}

	public Role getRole() {
		return role;
	}

	public UserStatus getStatus() {
		return status;
	}

	public boolean isMarketingAgreed() {
		return marketingAgreed;
	}

	public Instant getLastLoginAt() {
		return lastLoginAt;
	}

	public List<SocialAccount> getSocialAccounts() {
		return socialAccounts;
	}
}
