package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.AssignmentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, Long> {
    List<AssignmentSubmission> findByAssignmentId(Long assignmentId);
    List<AssignmentSubmission> findByUserId(Long userId);
    AssignmentSubmission findByAssignmentIdAndUserId(Long assignmentId, Long userId);
}
