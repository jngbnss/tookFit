package com.tukfit.display;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BannerRepository extends JpaRepository<Banner, Long> {

	@Query("""
			select b from Banner b
			where b.active = true and (:position is null or b.position = :position)
			  and (b.startsAt is null or b.startsAt <= :now) and (b.endsAt is null or b.endsAt > :now)
			order by b.position, b.sortOrder, b.id
			""")
	List<Banner> findVisible(@Param("position") BannerPosition position, @Param("now") Instant now);

	@Query("select b from Banner b where (:position is null or b.position = :position) order by b.position, b.sortOrder, b.id")
	List<Banner> findAllOrdered(@Param("position") BannerPosition position);
}
