package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByCourseId(Long courseId);
    List<Assignment> findByCourseIdAndStatus(Long courseId, String status);
}
