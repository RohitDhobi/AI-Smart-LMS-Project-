package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    List<QuizAttempt> findByQuizId(Long quizId);

    List<QuizAttempt> findByQuizIdOrderByAttemptedAtDesc(Long quizId);

    List<QuizAttempt> findByUserEmail(String email);

    List<QuizAttempt> findByOrderByAttemptedAtDesc();

    @Query("SELECT qa FROM QuizAttempt qa JOIN FETCH qa.quiz q JOIN FETCH qa.user u ORDER BY qa.attemptedAt DESC")
    List<QuizAttempt> findAllWithQuizAndUser();

    @Query("SELECT qa FROM QuizAttempt qa JOIN FETCH qa.quiz q JOIN FETCH qa.user u WHERE qa.user.email = :email ORDER BY qa.attemptedAt DESC")
    List<QuizAttempt> findByUserEmailWithQuiz(@Param("email") String email);
}
