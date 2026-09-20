package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.CodingProblem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CodingProblemRepository extends JpaRepository<CodingProblem, Long> {

    Optional<CodingProblem> findBySlug(String slug);

    List<CodingProblem> findByDifficultyOrderByOrderIndexAsc(String difficulty);

    List<CodingProblem> findByCategoryOrderByOrderIndexAsc(String category);

    List<CodingProblem> findAllByOrderByOrderIndexAsc();

    Optional<CodingProblem> findFirstByIsDailyChallengeTrue();

    @Query("SELECT p FROM CodingProblem p WHERE " +
            "(:difficulty IS NULL OR p.difficulty = :difficulty) AND " +
            "(:category IS NULL OR p.category = :category) AND " +
            "(:search IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.tags) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "ORDER BY p.orderIndex ASC")
    List<CodingProblem> searchProblems(
            @Param("difficulty") String difficulty,
            @Param("category") String category,
            @Param("search") String search
    );

    @Query("SELECT DISTINCT p.category FROM CodingProblem p ORDER BY p.category")
    List<String> findDistinctCategories();

    long countByDifficulty(String difficulty);
}
