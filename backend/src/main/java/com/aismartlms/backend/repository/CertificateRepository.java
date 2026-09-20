package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.*;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {

    List<Certificate> findByUser(User user);

    Optional<Certificate> findByCertificateId(String id);

    List<Certificate> findByCourse(Course course);

    List<Certificate> findByStatus(String status);

    List<Certificate> findByCourseAndStatus(Course course, String status);

    Optional<Certificate> findByUserAndCourse(User user, Course course);

    long countByStatus(String status);

    long countByCourseAndStatus(Course course, String status);

    @Query("SELECT c FROM Certificate c WHERE c.course.instructor = :instructorName")
    List<Certificate> findByInstructorName(@Param("instructorName") String instructorName);

    @Query("SELECT c FROM Certificate c WHERE c.course.instructor = :instructorName AND c.course = :course")
    List<Certificate> findByInstructorNameAndCourse(
            @Param("instructorName") String instructorName,
            @Param("course") Course course
    );

    @Query("SELECT c FROM Certificate c WHERE c.course.instructor = :instructorName AND c.status = :status")
    List<Certificate> findByInstructorNameAndStatus(
            @Param("instructorName") String instructorName,
            @Param("status") String status
    );

    @Query("SELECT COUNT(c) FROM Certificate c WHERE c.course.instructor = :instructorName")
    long countByInstructorName(@Param("instructorName") String instructorName);

    @Query("SELECT COUNT(c) FROM Certificate c WHERE c.course.instructor = :instructorName AND c.status = :status")
    long countByInstructorNameAndStatus(
            @Param("instructorName") String instructorName,
            @Param("status") String status
    );

    @Query("SELECT COUNT(c) FROM Certificate c WHERE c.course.instructor = :instructorName AND c.course = :course")
    long countByInstructorNameAndCourse(
            @Param("instructorName") String instructorName,
            @Param("course") Course course
    );
}
