package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.InstructorCourseAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InstructorCourseAssignmentRepository
        extends JpaRepository<InstructorCourseAssignment, Long> {

    List<InstructorCourseAssignment> findByInstructorId(Long instructorId);

    List<InstructorCourseAssignment> findByCourseId(Long courseId);

    List<InstructorCourseAssignment> findBySubjectId(Long subjectId);

    List<InstructorCourseAssignment> findByStatus(String status);

    List<InstructorCourseAssignment> findByInstructorIdAndStatus(
            Long instructorId, String status);

    void deleteByInstructorIdAndSubjectId(Long instructorId, Long subjectId);
}
