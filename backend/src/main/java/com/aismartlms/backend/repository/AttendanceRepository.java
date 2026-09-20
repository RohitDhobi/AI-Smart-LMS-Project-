package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByUserId(Long userId);
    List<Attendance> findByCourseId(Long courseId);
    List<Attendance> findByUserIdAndCourseId(Long userId, Long courseId);
    List<Attendance> findByCourseIdAndDate(Long courseId, LocalDate date);
    List<Attendance> findByCourseIdAndSubjectAndDate(Long courseId, String subject, LocalDate date);
}
