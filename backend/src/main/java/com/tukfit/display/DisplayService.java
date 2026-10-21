package com.tukfit.display;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tukfit.display.DisplayDtos.BannerDto;
import com.tukfit.display.DisplayDtos.NoticeDto;
import com.tukfit.display.DisplayDtos.NoticeSummary;
import com.tukfit.global.error.ApiException;
import com.tukfit.global.error.ErrorCode;
import com.tukfit.global.web.PageResponse;
import com.tukfit.storage.ImageUrls;

@Service
@Transactional(readOnly = true)
public class DisplayService {

	private final BannerRepository banners;
	private final NoticeRepository notices;
	private final ImageUrls imageUrls;

	public DisplayService(BannerRepository banners, NoticeRepository notices, ImageUrls imageUrls) {
		this.banners = banners;
		this.notices = notices;
		this.imageUrls = imageUrls;
	}

	public List<BannerDto> banners(BannerPosition position) {
		return banners.findVisible(position, Instant.now()).stream().map(this::toDto).toList();
	}

	public BannerDto toDto(Banner b) {
		return new BannerDto(b.getId(), b.getPosition(), b.getTitle(), b.getSubtitle(), imageUrls.url(b.getImageKey()),
				imageUrls.url(b.getMobileImageKey()), b.getLinkUrl(), b.getSortOrder());
	}

	public PageResponse<NoticeSummary> notices(int page, int size) {
		var pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 50),
				Sort.by(Sort.Order.desc("pinned"), Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
		return PageResponse.of(notices.findByPublishedTrue(pageable),
				n -> new NoticeSummary(n.getId(), n.getTitle(), n.isPinned(), n.getCreatedAt()));
	}

	public NoticeDto notice(Long id) {
		Notice n = notices.findByIdAndPublishedTrue(id).orElseThrow(() -> new ApiException(ErrorCode.NOTICE_NOT_FOUND));
		return new NoticeDto(n.getId(), n.getTitle(), n.getBody(), n.isPinned(), n.getCreatedAt());
	}
}
