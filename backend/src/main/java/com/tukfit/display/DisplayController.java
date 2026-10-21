package com.tukfit.display;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tukfit.display.DisplayDtos.BannerDto;
import com.tukfit.display.DisplayDtos.NoticeDto;
import com.tukfit.display.DisplayDtos.NoticeSummary;
import com.tukfit.display.DisplayDtos.StoreSettingsDto;
import com.tukfit.global.web.PageResponse;

@RestController
@RequestMapping("/api/v1")
public class DisplayController {

	private final DisplayService display;
	private final StoreSettingsService settings;

	public DisplayController(DisplayService display, StoreSettingsService settings) {
		this.display = display;
		this.settings = settings;
	}

	@GetMapping("/banners")
	public List<BannerDto> banners(@RequestParam(required = false) BannerPosition position) {
		return display.banners(position);
	}

	@GetMapping("/notices")
	public PageResponse<NoticeSummary> notices(@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {
		return display.notices(page, size);
	}

	@GetMapping("/notices/{id}")
	public NoticeDto notice(@PathVariable Long id) {
		return display.notice(id);
	}

	@GetMapping("/store/settings")
	public StoreSettingsDto storeSettings() {
		return settings.publicSettings();
	}
}
