package com.tukfit.global.config;

import java.nio.charset.StandardCharsets;
import java.sql.Connection;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.support.EncodedResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * dev 프로필 전용: DB가 비어 있으면 프로토타입 상품·테스트 계정을 넣는다.
 * 관리자 admin@tukfit.local / admin1234!, 회원 user@tukfit.local / user1234!
 */
@Component
@Profile("dev")
@Order(1)
public class DevDataSeeder implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(DevDataSeeder.class);

	private final DataSource dataSource;
	private final JdbcTemplate jdbc;
	private final PasswordEncoder passwordEncoder;

	public DevDataSeeder(DataSource dataSource, JdbcTemplate jdbc, PasswordEncoder passwordEncoder) {
		this.dataSource = dataSource;
		this.jdbc = jdbc;
		this.passwordEncoder = passwordEncoder;
	}

	@Override
	public void run(ApplicationArguments args) throws Exception {
		Integer categories = jdbc.queryForObject("SELECT count(*) FROM categories", Integer.class);
		if (categories != null && categories > 0) {
			return;
		}
		String sql = new ClassPathResource("db/seed/dev-seed.sql").getContentAsString(StandardCharsets.UTF_8)
				.replace("{{ADMIN_HASH}}", passwordEncoder.encode("admin1234!"))
				.replace("{{USER_HASH}}", passwordEncoder.encode("user1234!"));
		try (Connection connection = dataSource.getConnection()) {
			connection.setAutoCommit(false);
			ScriptUtils.executeSqlScript(connection,
					new EncodedResource(new ByteArrayResource(sql.getBytes(StandardCharsets.UTF_8)), StandardCharsets.UTF_8),
					false, false, ScriptUtils.DEFAULT_COMMENT_PREFIX, ";\n", ScriptUtils.DEFAULT_BLOCK_COMMENT_START_DELIMITER,
					ScriptUtils.DEFAULT_BLOCK_COMMENT_END_DELIMITER);
			connection.commit();
		}
		log.info("개발용 시드 데이터를 넣었어요. 관리자 admin@tukfit.local / admin1234!, 회원 user@tukfit.local / user1234!");
	}
}
