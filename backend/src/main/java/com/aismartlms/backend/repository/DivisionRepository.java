package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.Division;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DivisionRepository extends JpaRepository<Division, Long> {

    List<Division> findByCourseIdOrderByCodeAsc(Long courseId);

    List<Division> findByCourseIdAndSemesterOrderByCodeAsc(Long courseId, Integer semester);

    boolean existsByCourseIdAndCodeAndAcademicYear(Long courseId, String code, Integer academicYear);

    boolean existsByCourseIdAndCodeAndAcademicYearAndIdNot(
            Long courseId, String code, Integer academicYear, Long id);
}
