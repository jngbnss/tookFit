package com.tukfit.storage;

import org.springframework.stereotype.Component;

import com.tukfit.global.config.AppProperties;

/** 저장소 키를 브라우저가 바로 쓸 수 있는 완전한 URL로 바꾼다. */
@Component
public class ImageUrls {

	private final String baseUrl;

	public ImageUrls(AppProperties props) {
		String base = props.storage() == null ? null : props.storage().publicBaseUrl();
		this.baseUrl = base == null ? "" : base.replaceAll("/+$", "");
	}

	public String url(String storageKey) {
		if (storageKey == null || storageKey.isBlank()) {
			return null;
		}
		if (storageKey.startsWith("http://") || storageKey.startsWith("https://")) {
			return storageKey;
		}
		return baseUrl + "/" + storageKey.replaceAll("^/+", "");
	}
}
