package com.tukfit.user;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AddressRepository extends JpaRepository<Address, Long> {

	List<Address> findByUserIdOrderByIsDefaultDescIdDesc(Long userId);

	Optional<Address> findByIdAndUserId(Long id, Long userId);

	long countByUserId(Long userId);

	@Modifying
	@Query("update Address a set a.isDefault = false where a.userId = :userId and a.id <> :keepId")
	void clearDefault(@Param("userId") Long userId, @Param("keepId") Long keepId);

	@Modifying
	@Query("delete from Address a where a.userId = :userId")
	void deleteByUserId(@Param("userId") Long userId);
}
