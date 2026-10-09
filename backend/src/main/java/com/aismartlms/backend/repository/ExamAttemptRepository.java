package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.ExamAttempt;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, Long> {

    List<ExamAttempt> findByUserIdOrderBySubmittedAtDesc(Long userId);

    List<ExamAttempt> findByExamIdOrderBySubmittedAtDesc(Long examId);

    List<ExamAttempt> findByExamIdAndUserIdOrderBySubmittedAtDesc(Long examId, Long userId);
}
