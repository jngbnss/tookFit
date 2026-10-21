package com.tukfit.display;

import java.time.Instant;

import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** 스토어 설정. 한 행(id = 1)만 존재한다. */
@Entity
@Table(name = "store_settings")
@EntityListeners(AuditingEntityListener.class)
public class StoreSettings {

	public static final long ID = 1L;

	@Id
	private Long id;

	private String storeName;
	private long shippingFee;
	private long freeShippingThreshold;
	private int maxQuantityPerItem;
	private long returnShippingFee;
	private String csPhone;
	private String csEmail;
	private String csHours;
	private String companyName;
	private String ceoName;
	private String registrationNumber;
	private String mailOrderNumber;
	private String businessAddress;
	private String privacyOfficer;

	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	@LastModifiedDate
	@Column(nullable = false)
	private Instant updatedAt;

	protected StoreSettings() {
	}

	public void update(String storeName, long shippingFee, long freeShippingThreshold, int maxQuantityPerItem,
			long returnShippingFee, String csPhone, String csEmail, String csHours, String companyName,
			String ceoName, String registrationNumber, String mailOrderNumber, String businessAddress,
			String privacyOfficer) {
		this.storeName = storeName;
		this.shippingFee = shippingFee;
		this.freeShippingThreshold = freeShippingThreshold;
		this.maxQuantityPerItem = maxQuantityPerItem;
		this.returnShippingFee = returnShippingFee;
		this.csPhone = csPhone;
		this.csEmail = csEmail;
		this.csHours = csHours;
		this.companyName = companyName;
		this.ceoName = ceoName;
		this.registrationNumber = registrationNumber;
		this.mailOrderNumber = mailOrderNumber;
		this.businessAddress = businessAddress;
		this.privacyOfficer = privacyOfficer;
	}

	public String getStoreName() {
		return storeName;
	}

	public long getShippingFee() {
		return shippingFee;
	}

	public long getFreeShippingThreshold() {
		return freeShippingThreshold;
	}

	public int getMaxQuantityPerItem() {
		return maxQuantityPerItem;
	}

	public long getReturnShippingFee() {
		return returnShippingFee;
	}

	public String getCsPhone() {
		return csPhone;
	}

	public String getCsEmail() {
		return csEmail;
	}

	public String getCsHours() {
		return csHours;
	}

	public String getCompanyName() {
		return companyName;
	}

	public String getCeoName() {
		return ceoName;
	}

	public String getRegistrationNumber() {
		return registrationNumber;
	}

	public String getMailOrderNumber() {
		return mailOrderNumber;
	}

	public String getBusinessAddress() {
		return businessAddress;
	}

	public String getPrivacyOfficer() {
		return privacyOfficer;
	}
}
