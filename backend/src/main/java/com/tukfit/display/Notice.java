package com.tukfit.display;

import com.tukfit.global.entity.BaseEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "notices")
public class Notice extends BaseEntity {

	private String title;
	private String body;
	private boolean pinned;
	private boolean published;

	public void update(String title, String body, boolean pinned, boolean published) {
		this.title = title;
		this.body = body;
		this.pinned = pinned;
		this.published = published;
	}

	public String getTitle() {
		return title;
	}

	public String getBody() {
		return body;
	}

	public boolean isPinned() {
		return pinned;
	}

	public boolean isPublished() {
		return published;
	}
}
