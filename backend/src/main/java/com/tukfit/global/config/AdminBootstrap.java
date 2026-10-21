package com.tukfit.global.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.tukfit.user.Role;
import com.tukfit.user.User;
import com.tukfit.user.UserRepository;

/** ADMIN_EMAIL, ADMIN_PASSWORD가 있으면 서버가 처음 뜰 때 관리자 계정을 만든다. 이미 있으면 건드리지 않는다. */
@Component
@Order(2)
public class AdminBootstrap implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

	private final AppProperties props;
	private final UserRepository users;
	private final PasswordEncoder passwordEncoder;

	public AdminBootstrap(AppProperties props, UserRepository users, PasswordEncoder passwordEncoder) {
		this.props = props;
		this.users = users;
		this.passwordEncoder = passwordEncoder;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		AppProperties.Admin admin = props.admin();
		if (admin == null || blank(admin.email()) || blank(admin.password())) {
			return;
		}
		String email = admin.email().trim().toLowerCase();
		if (users.existsByEmailIgnoreCase(email)) {
			return;
		}
		if (admin.password().length() < 10) {
			log.warn("ADMIN_PASSWORD가 10자보다 짧아 관리자 계정을 만들지 않았어요.");
			return;
		}
		users.save(new User(email, passwordEncoder.encode(admin.password()), "관리자", null, Role.ADMIN, false));
		log.info("관리자 계정을 만들었어요: {}", email);
	}

	private static boolean blank(String v) {
		return v == null || v.isBlank();
	}
}
