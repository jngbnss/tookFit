package com.tukfit.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.tukfit.global.config.AppProperties;

/** 메일 서버(MAIL_HOST)가 설정돼 있으면 보내고, 없으면 로그에 남긴다. */
@Service
public class MailService {

	private static final Logger log = LoggerFactory.getLogger(MailService.class);

	private final ObjectProvider<JavaMailSender> sender;
	private final AppProperties props;
	private final boolean configured;

	public MailService(ObjectProvider<JavaMailSender> sender, AppProperties props,
			@Value("${spring.mail.host:}") String host) {
		this.sender = sender;
		this.props = props;
		this.configured = host != null && !host.isBlank();
	}

	public void send(String to, String subject, String text) {
		JavaMailSender mailSender = configured ? sender.getIfAvailable() : null;
		if (mailSender == null) {
			log.info("[메일 미설정] to={} subject={}\n{}", to, subject, text);
			return;
		}
		SimpleMailMessage message = new SimpleMailMessage();
		message.setFrom(props.mail().from());
		message.setTo(to);
		message.setSubject(subject);
		message.setText(text);
		try {
			mailSender.send(message);
		}
		catch (RuntimeException e) {
			log.error("메일 발송 실패 to={}", to, e);
		}
	}
}
