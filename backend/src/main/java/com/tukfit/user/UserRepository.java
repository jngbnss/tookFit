package com.tukfit.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

	Optional<User> findByEmailIgnoreCase(String email);

	boolean existsByEmailIgnoreCase(String email);

	@Query("select s.user from SocialAccount s where s.provider = :provider and s.providerUserId = :providerUserId")
	Optional<User> findBySocial(@Param("provider") SocialProvider provider,
			@Param("providerUserId") String providerUserId);

}
