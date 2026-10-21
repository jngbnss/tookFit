package com.tukfit.user;

import com.tukfit.global.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "addresses")
public class Address extends BaseEntity {

	@Column(name = "user_id", nullable = false)
	private Long userId;

	private String label;
	private String recipient;
	private String phone;
	private String postalCode;
	private String address1;
	private String address2;
	private boolean isDefault;

	protected Address() {
	}

	public Address(Long userId) {
		this.userId = userId;
	}

	public void update(String label, String recipient, String phone, String postalCode, String address1,
			String address2) {
		this.label = label;
		this.recipient = recipient;
		this.phone = phone;
		this.postalCode = postalCode;
		this.address1 = address1;
		this.address2 = address2;
	}

	public void markDefault(boolean isDefault) {
		this.isDefault = isDefault;
	}

	public Long getUserId() {
		return userId;
	}

	public String getLabel() {
		return label;
	}

	public String getRecipient() {
		return recipient;
	}

	public String getPhone() {
		return phone;
	}

	public String getPostalCode() {
		return postalCode;
	}

	public String getAddress1() {
		return address1;
	}

	public String getAddress2() {
		return address2;
	}

	public boolean isDefault() {
		return isDefault;
	}
}
