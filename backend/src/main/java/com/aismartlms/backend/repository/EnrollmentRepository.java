package com.aismartlms.backend.repository;

import com.aismartlms.backend.entity.Enrollment;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.entity.Course;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface EnrollmentRepository
        extends JpaRepository<Enrollment, Long> {

    // Check whether a student is already enrolled
    boolean existsByUserAndCourse(User user, Course course);

    // Get all enrollments of a student
    List<Enrollment> findByUser(User user);

    // Get all students enrolled in a course
    List<Enrollment> findByCourse(Course course);

    // Find a specific enrollment
    Optional<Enrollment> findByUserAndCourse(
            User user,
            Course course
    );
}