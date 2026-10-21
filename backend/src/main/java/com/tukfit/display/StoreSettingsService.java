package com.tukfit.display;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tukfit.auth.oauth.SocialClients;
import com.tukfit.display.DisplayDtos.AdminSettings;
import com.tukfit.display.DisplayDtos.Business;
import com.tukfit.display.DisplayDtos.StoreSettingsDto;
import com.tukfit.payment.PaymentGateways;

@Service
public class StoreSettingsService {

	private final StoreSettingsRepository repository;
	private final SocialClients socialClients;
	private final PaymentGateways gateways;

	public StoreSettingsService(StoreSettingsRepository repository, SocialClients socialClients,
			PaymentGateways gateways) {
		this.repository = repository;
		this.socialClients = socialClients;
		this.gateways = gateways;
	}

	@Transactional(readOnly = true)
	public StoreSettings get() {
		return repository.findById(StoreSettings.ID).orElseThrow();
	}

	@Transactional(readOnly = true)
	public StoreSettingsDto publicSettings() {
		StoreSettings s = get();
		return new StoreSettingsDto(s.getStoreName(), s.getShippingFee(), s.getFreeShippingThreshold(),
				s.getMaxQuantityPerItem(), s.getReturnShippingFee(), s.getCsPhone(), s.getCsEmail(), s.getCsHours(),
				business(s), socialClients.providers(), gateways.active().provider().name());
	}

	@Transactional(readOnly = true)
	public AdminSettings adminSettings() {
		StoreSettings s = get();
		return new AdminSettings(s.getStoreName(), s.getShippingFee(), s.getFreeShippingThreshold(),
				s.getMaxQuantityPerItem(), s.getReturnShippingFee(), s.getCsPhone(), s.getCsEmail(), s.getCsHours(),
				business(s));
	}

	@Transactional
	public AdminSettings update(AdminSettings r) {
		StoreSettings s = get();
		Business b = r.business();
		s.update(r.storeName(), r.shippingFee(), r.freeShippingThreshold(), r.maxQuantityPerItem(),
				r.returnShippingFee(), blank(r.csPhone()), blank(r.csEmail()), blank(r.csHours()),
				blank(b.companyName()), blank(b.ceoName()), blank(b.registrationNumber()), blank(b.mailOrderNumber()),
				blank(b.address()), blank(b.privacyOfficer()));
		return adminSettings();
	}

	private Business business(StoreSettings s) {
		return new Business(s.getCompanyName(), s.getCeoName(), s.getRegistrationNumber(), s.getMailOrderNumber(),
				s.getBusinessAddress(), s.getPrivacyOfficer());
	}

	private static String blank(String v) {
		return v == null || v.isBlank() ? null : v.trim();
	}
}
