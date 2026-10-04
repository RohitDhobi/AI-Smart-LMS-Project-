package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.AcademicYear;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AcademicYearRepository extends JpaRepository<AcademicYear, Long> {

    List<AcademicYear> findAllByOrderByYearNameDesc();

    Optional<AcademicYear> findByYearName(String yearName);

    Optional<AcademicYear> findFirstByActiveTrue();
}
