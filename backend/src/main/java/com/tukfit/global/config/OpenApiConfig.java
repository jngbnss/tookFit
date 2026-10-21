package com.tukfit.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

@Configuration
public class OpenApiConfig {

	@Bean
	OpenAPI tukfitOpenApi() {
		return new OpenAPI().info(new Info().title("TUK FIT API").version("v1")
				.description("쇼핑몰 API. 계약 문서: docs/API.md, docs/API-CONTRACT.md"));
	}
}
