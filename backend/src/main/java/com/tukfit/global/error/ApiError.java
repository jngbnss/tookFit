package com.tukfit.global.error;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(String code, String message, Map<String, String> fields) {

	public static ApiError of(ErrorCode code) {
		return new ApiError(code.name(), code.message(), null);
	}
}
