package com.tukfit.global.error;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	@ExceptionHandler(ApiException.class)
	ResponseEntity<ApiError> handleApi(ApiException e) {
		return ResponseEntity.status(e.getCode().status())
				.body(new ApiError(e.getCode().name(), e.getMessage(), e.getFields()));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	ResponseEntity<ApiError> handleInvalid(MethodArgumentNotValidException e) {
		Map<String, String> fields = new LinkedHashMap<>();
		for (FieldError error : e.getBindingResult().getFieldErrors()) {
			fields.putIfAbsent(error.getField(), error.getDefaultMessage());
		}
		return validation(fields);
	}

	@ExceptionHandler(HandlerMethodValidationException.class)
	ResponseEntity<ApiError> handleMethodValidation(HandlerMethodValidationException e) {
		Map<String, String> fields = new LinkedHashMap<>();
		e.getParameterValidationResults().forEach(result -> result.getResolvableErrors()
				.forEach(error -> fields.putIfAbsent(result.getMethodParameter().getParameterName(),
						error.getDefaultMessage())));
		return validation(fields);
	}

	@ExceptionHandler({ HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class,
			MissingServletRequestParameterException.class })
	ResponseEntity<ApiError> handleBadRequest(Exception e) {
		return ResponseEntity.badRequest().body(ApiError.of(ErrorCode.BAD_REQUEST));
	}

	@ExceptionHandler(HttpRequestMethodNotSupportedException.class)
	ResponseEntity<ApiError> handleMethod(HttpRequestMethodNotSupportedException e) {
		return ResponseEntity.status(405).body(new ApiError("METHOD_NOT_ALLOWED", "지원하지 않는 요청이에요.", null));
	}

	@ExceptionHandler(NoResourceFoundException.class)
	ResponseEntity<ApiError> handleNoResource(NoResourceFoundException e) {
		return ResponseEntity.status(404).body(ApiError.of(ErrorCode.NOT_FOUND));
	}

	@ExceptionHandler({ AccessDeniedException.class, AuthorizationDeniedException.class })
	ResponseEntity<ApiError> handleDenied(Exception e) {
		return ResponseEntity.status(403).body(ApiError.of(ErrorCode.FORBIDDEN));
	}

	@ExceptionHandler(Exception.class)
	ResponseEntity<ApiError> handleUnknown(Exception e) {
		log.error("Unhandled exception", e);
		return ResponseEntity.status(500).body(ApiError.of(ErrorCode.INTERNAL_ERROR));
	}

	private ResponseEntity<ApiError> validation(Map<String, String> fields) {
		return ResponseEntity.badRequest()
				.body(new ApiError(ErrorCode.VALIDATION_FAILED.name(), ErrorCode.VALIDATION_FAILED.message(), fields));
	}
}
