package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByCourseId(Long courseId);
    List<Exam> findByCourseIdAndStatus(Long courseId, String status);

    /** Exams in one workflow status (e.g. every exam awaiting HOD approval). */
    List<Exam> findByStatusOrderByCreatedAtDesc(String status);

    /** Exams created by one instructor (the "My Exams" list). */
    List<Exam> findByCreatedByOrderByCreatedAtDesc(Long createdBy);

    /** One instructor's exams in a given status (dashboard counts). */
    long countByCreatedByAndStatus(Long createdBy, String status);
}
