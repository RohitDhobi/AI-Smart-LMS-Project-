package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubjectRepository extends JpaRepository<Subject, Long> {

    List<Subject> findByCourseId(Long courseId);

    List<Subject> findByCourseIdOrderBySemesterAscSubjectNameAsc(Long courseId);

    List<Subject> findByCourseIdAndSemesterOrderBySubjectNameAsc(
            Long courseId,
            Integer semester
    );

    Optional<Subject> findByCourseIdAndSemesterAndSubjectNameIgnoreCase(
            Long courseId,
            Integer semester,
            String subjectName
    );

    boolean existsByCourseId(Long courseId);
}
