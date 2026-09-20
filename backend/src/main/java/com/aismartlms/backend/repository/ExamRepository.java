package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByCourseId(Long courseId);
    List<Exam> findByCourseIdAndStatus(Long courseId, String status);
}
