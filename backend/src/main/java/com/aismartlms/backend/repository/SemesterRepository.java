package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.Semester;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SemesterRepository extends JpaRepository<Semester, Long> {

    List<Semester> findByCourseIdOrderBySemesterNumberAsc(Long courseId);

    List<Semester> findAllByOrderByCourseIdAscSemesterNumberAsc();

    Optional<Semester> findByCourseIdAndSemesterNumber(Long courseId, Integer semesterNumber);
}
