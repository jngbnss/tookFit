package com.tukfit.catalog;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

	@EntityGraph(attributePaths = "category")
	Optional<Product> findBySlug(String slug);

	boolean existsBySlug(String slug);

	boolean existsBySlugAndIdNot(String slug, Long id);

	long countByCategoryId(Long categoryId);

	@Query("""
			select p from Product p
			where p.status = com.tukfit.catalog.ProductStatus.ACTIVE
			  and lower(p.name) like lower(concat('%', :q, '%'))
			order by p.featuredRank asc nulls last, p.id asc
			""")
	List<Product> suggest(@Param("q") String q, Pageable pageable);

	@Query("""
			select p from Product p
			where p.status = com.tukfit.catalog.ProductStatus.ACTIVE
			  and p.category.id = :categoryId and p.id <> :productId
			order by p.featuredRank asc nulls last, p.id asc
			""")
	List<Product> related(@Param("categoryId") Long categoryId, @Param("productId") Long productId,
			Pageable pageable);

	@Query("""
			select p from Product p
			where p.status = com.tukfit.catalog.ProductStatus.ACTIVE
			  and p.category.id <> :categoryId
			order by p.featuredRank asc nulls last, p.id asc
			""")
	List<Product> popularOutside(@Param("categoryId") Long categoryId, Pageable pageable);
}
