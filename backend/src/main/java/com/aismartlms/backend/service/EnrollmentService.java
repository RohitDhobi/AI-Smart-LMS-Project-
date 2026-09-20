package com.aismartlms.backend.service;

import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.Enrollment;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.repository.CourseRepository;
import com.aismartlms.backend.repository.EnrollmentRepository;
import com.aismartlms.backend.repository.UserRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    public EnrollmentService(
            EnrollmentRepository enrollmentRepository,
            UserRepository userRepository,
            CourseRepository courseRepository) {

        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
    }

    // =========================
    // ENROLL STUDENT IN COURSE
    // =========================

    public Enrollment enrollUser(
            String email,
            Long courseId) {

        // Find user
        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        // Find course
        Course course = courseRepository
                .findById(courseId)
                .orElseThrow(() ->
                        new RuntimeException("Course not found")
                );

        // Check existing enrollment
        if (enrollmentRepository
                .existsByUserAndCourse(user, course)) {

            throw new RuntimeException(
                    "User already enrolled in this course"
            );
        }

        // Create enrollment
        Enrollment enrollment =
                new Enrollment(user, course);

        return enrollmentRepository.save(enrollment);
    }

    // =========================
    // GET USER ENROLLMENTS
    // =========================

    public List<Enrollment> getUserEnrollments(
            String email) {

        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        return enrollmentRepository.findByUser(user);
    }
}