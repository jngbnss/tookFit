package com.tukfit.catalog;

import com.tukfit.global.entity.BaseEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "categories")
public class Category extends BaseEntity {

	private String slug;
	private String name;
	private int sortOrder;
	private boolean visible;

	protected Category() {
	}

	public Category(String slug, String name, int sortOrder, boolean visible) {
		update(slug, name, sortOrder, visible);
	}

	public void update(String slug, String name, int sortOrder, boolean visible) {
		this.slug = slug;
		this.name = name;
		this.sortOrder = sortOrder;
		this.visible = visible;
	}

	public String getSlug() {
		return slug;
	}

	public String getName() {
		return name;
	}

	public int getSortOrder() {
		return sortOrder;
	}

	public boolean isVisible() {
		return visible;
	}
}
