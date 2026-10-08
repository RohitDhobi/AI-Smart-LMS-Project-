package com.aismartlms.backend.service;

import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.Enrollment;
import com.aismartlms.backend.entity.Role;
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

    // =========================
    // UNENROLL USER FROM COURSE (self-service drop)
    // =========================

    public void unenrollUser(
            String email,
            Long courseId) {

        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        Course course = courseRepository
                .findById(courseId)
                .orElseThrow(() ->
                        new RuntimeException("Course not found")
                );

        Enrollment enrollment = enrollmentRepository
                .findByUserAndCourse(user, course)
                .orElseThrow(() ->
                        new RuntimeException("Not enrolled in this course")
                );

        enrollmentRepository.delete(enrollment);
    }

    // =========================
    // ALL ENROLLMENTS (admin / HOD management view)
    // =========================

    public List<Enrollment> getAllEnrollments() {
        return enrollmentRepository.findAll();
    }

    // =========================
    // STAFF: ENROLL A STUDENT INTO A COURSE (admin / HOD)
    // =========================

    public Enrollment enrollStudent(
            Long studentId,
            Long courseId) {

        User student = userRepository
                .findById(studentId)
                .orElseThrow(() ->
                        new RuntimeException("Student not found")
                );

        if (student.getRole() != Role.STUDENT) {
            throw new RuntimeException(
                    "Target user is not a student"
            );
        }

        Course course = courseRepository
                .findById(courseId)
                .orElseThrow(() ->
                        new RuntimeException("Course not found")
                );

        if (enrollmentRepository.existsByUserAndCourse(student, course)) {
            throw new RuntimeException(
                    "User already enrolled in this course"
            );
        }

        return enrollmentRepository.save(
                new Enrollment(student, course)
        );
    }

    // =========================
    // STAFF: REMOVE AN ENROLLMENT BY ID (admin / HOD)
    // =========================

    public void removeStudentEnrollment(Long enrollmentId) {

        Enrollment enrollment = enrollmentRepository
                .findById(enrollmentId)
                .orElseThrow(() ->
                        new RuntimeException("Enrollment not found")
                );

        enrollmentRepository.delete(enrollment);
    }
}