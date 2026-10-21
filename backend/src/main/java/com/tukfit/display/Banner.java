package com.tukfit.display;

import java.time.Instant;

import com.tukfit.global.entity.BaseEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "banners")
public class Banner extends BaseEntity {

	@Enumerated(EnumType.STRING)
	private BannerPosition position;

	private String title;
	private String subtitle;
	private String imageKey;
	private String mobileImageKey;
	private String linkUrl;
	private int sortOrder;
	private Instant startsAt;
	private Instant endsAt;
	private boolean active;

	public void update(BannerPosition position, String title, String subtitle, String imageKey,
			String mobileImageKey, String linkUrl, int sortOrder, Instant startsAt, Instant endsAt, boolean active) {
		this.position = position;
		this.title = title;
		this.subtitle = subtitle;
		this.imageKey = imageKey;
		this.mobileImageKey = mobileImageKey;
		this.linkUrl = linkUrl;
		this.sortOrder = sortOrder;
		this.startsAt = startsAt;
		this.endsAt = endsAt;
		this.active = active;
	}

	public void changeSortOrder(int sortOrder) {
		this.sortOrder = sortOrder;
	}

	public BannerPosition getPosition() {
		return position;
	}

	public String getTitle() {
		return title;
	}

	public String getSubtitle() {
		return subtitle;
	}

	public String getImageKey() {
		return imageKey;
	}

	public String getMobileImageKey() {
		return mobileImageKey;
	}

	public String getLinkUrl() {
		return linkUrl;
	}

	public int getSortOrder() {
		return sortOrder;
	}

	public Instant getStartsAt() {
		return startsAt;
	}

	public Instant getEndsAt() {
		return endsAt;
	}

	public boolean isActive() {
		return active;
	}
}
