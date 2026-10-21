package com.tukfit.storage;

import java.net.URI;
import java.time.Duration;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.DisposableBean;
import org.springframework.stereotype.Service;

import com.tukfit.global.config.AppProperties;
import com.tukfit.global.error.ApiException;
import com.tukfit.global.error.ErrorCode;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * 관리자 이미지 업로드용 presigned URL. 브라우저가 R2/S3로 직접 PUT 하므로 서버를 거치지 않는다.
 * 저장소가 설정되지 않았으면 STORAGE_NOT_CONFIGURED.
 */
@Service
public class StorageService implements DisposableBean {

	private static final Duration TTL = Duration.ofMinutes(10);
	private static final Set<String> FOLDERS = Set.of("products", "banners");
	private static final Map<String, String> EXTENSIONS = Map.of(
			"image/jpeg", "jpg", "image/png", "png", "image/webp", "webp", "image/gif", "gif", "image/avif", "avif");

	private final AppProperties.Storage storage;
	private final ImageUrls imageUrls;
	private final S3Presigner presigner;

	public StorageService(AppProperties props, ImageUrls imageUrls) {
		this.storage = props.storage();
		this.imageUrls = imageUrls;
		this.presigner = configured() ? S3Presigner.builder()
				.endpointOverride(URI.create(storage.endpoint()))
				.region(Region.of(storage.region()))
				.credentialsProvider(StaticCredentialsProvider
					.create(AwsBasicCredentials.create(storage.accessKey(), storage.secretKey())))
				.serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(storage.pathStyle()).build())
				.build() : null;
	}

	public Presigned presign(String filename, String contentType, String folder) {
		if (presigner == null) {
			throw new ApiException(ErrorCode.STORAGE_NOT_CONFIGURED);
		}
		String ext = EXTENSIONS.get(contentType == null ? "" : contentType.toLowerCase(Locale.ROOT));
		if (ext == null) {
			throw new ApiException(ErrorCode.VALIDATION_FAILED, "jpg, png, webp, gif, avif 이미지만 올릴 수 있어요.");
		}
		if (!FOLDERS.contains(folder)) {
			throw new ApiException(ErrorCode.VALIDATION_FAILED, "folder는 products 또는 banners여야 해요.");
		}
		String key = folder + "/" + LocalDate.now() + "/" + UUID.randomUUID() + "." + ext;
		PutObjectRequest put = PutObjectRequest.builder().bucket(storage.bucket()).key(key).contentType(contentType)
				.cacheControl("public, max-age=31536000, immutable").build();
		var request = presigner.presignPutObject(b -> b.signatureDuration(TTL).putObjectRequest(put));
		Map<String, String> headers = Map.of("Content-Type", contentType, "Cache-Control",
				"public, max-age=31536000, immutable");
		return new Presigned(request.url().toString(), key, imageUrls.url(key), headers);
	}

	private boolean configured() {
		return storage != null && notBlank(storage.endpoint()) && notBlank(storage.bucket())
				&& notBlank(storage.accessKey()) && notBlank(storage.secretKey());
	}

	private static boolean notBlank(String v) {
		return v != null && !v.isBlank();
	}

	@Override
	public void destroy() {
		if (presigner != null) {
			presigner.close();
		}
	}

	public record Presigned(String uploadUrl, String storageKey, String publicUrl, Map<String, String> headers) {
	}
}
