package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.CodingProblem;
import com.aismartlms.backend.entity.CodingSubmission;
import com.aismartlms.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CodingSubmissionRepository extends JpaRepository<CodingSubmission, Long> {

    List<CodingSubmission> findByUserOrderBySubmittedAtDesc(User user);

    List<CodingSubmission> findByUserAndProblemOrderBySubmittedAtDesc(User user, CodingProblem problem);

    List<CodingSubmission> findByProblemOrderBySubmittedAtDesc(CodingProblem problem);

    boolean existsByUserAndProblemAndStatus(User user, CodingProblem problem, String status);

    @Query("SELECT DISTINCT s.problem.id FROM CodingSubmission s WHERE s.user = :user AND s.status = 'ACCEPTED'")
    List<Long> findSolvedProblemIdsByUser(@Param("user") User user);

    @Query("SELECT DISTINCT s.problem.id FROM CodingSubmission s WHERE s.user = :user")
    List<Long> findAttemptedProblemIdsByUser(@Param("user") User user);

    @Query("SELECT COUNT(DISTINCT s.problem.id) FROM CodingSubmission s WHERE s.user = :user AND s.status = 'ACCEPTED'")
    long countSolvedProblemsByUser(@Param("user") User user);

    @Query("SELECT COUNT(DISTINCT s.problem.id) FROM CodingSubmission s WHERE s.user = :user AND s.status = 'ACCEPTED' AND s.problem.difficulty = :difficulty")
    long countSolvedProblemsByUserAndDifficulty(@Param("user") User user, @Param("difficulty") String difficulty);

    @Query("SELECT COALESCE(SUM(s.xpEarned), 0) FROM CodingSubmission s WHERE s.user = :user")
    long sumXpEarnedByUser(@Param("user") User user);
}
