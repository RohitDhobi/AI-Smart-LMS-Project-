package com.aismartlms.backend.service;

import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.Enrollment;
import com.aismartlms.backend.entity.Role;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.repository.CourseRepository;
import com.aismartlms.backend.repository.EnrollmentRepository;
import com.aismartlms.backend.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Covers the enrollment system's service layer:
 * self-service enroll/unenroll plus the admin/HOD management
 * operations (list all, enroll a student, remove an enrollment).
 */
class EnrollmentServiceTest {

    private static final String STUDENT_EMAIL = "student@example.com";
    private static final Long STUDENT_ID = 50L;
    private static final Long COURSE_ID = 11L;
    private static final Long ENROLLMENT_ID = 7L;

    private EnrollmentRepository enrollments;
    private UserRepository users;
    private CourseRepository courses;
    private EnrollmentService service;

    private User student;
    private Course course;
    private Enrollment enrollment;

    @BeforeEach
    void setUp() {
        enrollments = mock(EnrollmentRepository.class);
        users = mock(UserRepository.class);
        courses = mock(CourseRepository.class);

        service = new EnrollmentService(enrollments, users, courses);

        student = new User();
        student.setId(STUDENT_ID);
        student.setEmail(STUDENT_EMAIL);
        student.setRole(Role.STUDENT);

        course = new Course();
        course.setId(COURSE_ID);
        course.setCourseName("Bachelor of Business Administration");

        enrollment = new Enrollment(student, course);
        enrollment.setId(ENROLLMENT_ID);

        when(users.findByEmail(STUDENT_EMAIL))
                .thenReturn(Optional.of(student));
        when(courses.findById(COURSE_ID))
                .thenReturn(Optional.of(course));
    }

    // ---------------------------------------------------------
    // Self-service enroll
    // ---------------------------------------------------------

    @Test
    void enrollUserSavesANewEnrollment() {
        when(enrollments.existsByUserAndCourse(student, course))
                .thenReturn(false);
        when(enrollments.save(any(Enrollment.class)))
                .thenReturn(enrollment);

        Enrollment saved = service.enrollUser(STUDENT_EMAIL, COURSE_ID);

        assertNotNull(saved);
        assertEquals(ENROLLMENT_ID, saved.getId());
        verify(enrollments).save(any(Enrollment.class));
    }

    @Test
    void enrollUserRejectsDuplicateEnrollment() {
        when(enrollments.existsByUserAndCourse(student, course))
                .thenReturn(true);

        RuntimeException ex = assertThrows(
                RuntimeException.class,
                () -> service.enrollUser(STUDENT_EMAIL, COURSE_ID)
        );

        assertEquals("User already enrolled in this course", ex.getMessage());
        verify(enrollments, never()).save(any(Enrollment.class));
    }

    @Test
    void enrollUserThrowsWhenCourseMissing() {
        when(courses.findById(COURSE_ID)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(
                RuntimeException.class,
                () -> service.enrollUser(STUDENT_EMAIL, COURSE_ID)
        );

        assertEquals("Course not found", ex.getMessage());
        verify(enrollments, never()).save(any(Enrollment.class));
    }

    // ---------------------------------------------------------
    // Self-service unenroll
    // ---------------------------------------------------------

    @Test
    void unenrollUserDeletesTheExistingEnrollment() {
        when(enrollments.findByUserAndCourse(student, course))
                .thenReturn(Optional.of(enrollment));

        service.unenrollUser(STUDENT_EMAIL, COURSE_ID);

        verify(enrollments).delete(enrollment);
    }

    @Test
    void unenrollUserThrowsWhenNotEnrolled() {
        when(enrollments.findByUserAndCourse(student, course))
                .thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(
                RuntimeException.class,
                () -> service.unenrollUser(STUDENT_EMAIL, COURSE_ID)
        );

        assertEquals("Not enrolled in this course", ex.getMessage());
        verify(enrollments, never()).delete(any(Enrollment.class));
    }

    // ---------------------------------------------------------
    // Staff: list all enrollments
    // ---------------------------------------------------------

    @Test
    void getAllEnrollmentsReturnsRepositoryRows() {
        when(enrollments.findAll()).thenReturn(List.of(enrollment));

        List<Enrollment> all = service.getAllEnrollments();

        assertEquals(1, all.size());
        assertEquals(ENROLLMENT_ID, all.get(0).getId());
    }

    // ---------------------------------------------------------
    // Staff: enroll a student into a course
    // ---------------------------------------------------------

    @Test
    void enrollStudentSavesEnrollmentForValidStudent() {
        when(users.findById(STUDENT_ID))
                .thenReturn(Optional.of(student));
        when(enrollments.existsByUserAndCourse(student, course))
                .thenReturn(false);
        when(enrollments.save(any(Enrollment.class)))
                .thenReturn(enrollment);

        Enrollment saved = service.enrollStudent(STUDENT_ID, COURSE_ID);

        assertEquals(ENROLLMENT_ID, saved.getId());
        verify(enrollments).save(any(Enrollment.class));
    }

    @Test
    void enrollStudentRejectsNonStudentTargets() {
        User instructor = new User();
        instructor.setId(9L);
        instructor.setEmail("instructor@example.com");
        instructor.setRole(Role.INSTRUCTOR);

        when(users.findById(9L)).thenReturn(Optional.of(instructor));

        RuntimeException ex = assertThrows(
                RuntimeException.class,
                () -> service.enrollStudent(9L, COURSE_ID)
        );

        assertEquals("Target user is not a student", ex.getMessage());
        verify(enrollments, never()).save(any(Enrollment.class));
    }

    @Test
    void enrollStudentRejectsDuplicateEnrollment() {
        when(users.findById(STUDENT_ID))
                .thenReturn(Optional.of(student));
        when(enrollments.existsByUserAndCourse(student, course))
                .thenReturn(true);

        RuntimeException ex = assertThrows(
                RuntimeException.class,
                () -> service.enrollStudent(STUDENT_ID, COURSE_ID)
        );

        assertEquals("User already enrolled in this course", ex.getMessage());
        verify(enrollments, never()).save(any(Enrollment.class));
    }

    @Test
    void enrollStudentThrowsWhenStudentMissing() {
        when(users.findById(404L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(
                RuntimeException.class,
                () -> service.enrollStudent(404L, COURSE_ID)
        );

        assertEquals("Student not found", ex.getMessage());
        verify(enrollments, never()).save(any(Enrollment.class));
    }

    // ---------------------------------------------------------
    // Staff: remove an enrollment by id
    // ---------------------------------------------------------

    @Test
    void removeStudentEnrollmentDeletesTheRow() {
        when(enrollments.findById(ENROLLMENT_ID))
                .thenReturn(Optional.of(enrollment));

        service.removeStudentEnrollment(ENROLLMENT_ID);

        verify(enrollments).delete(enrollment);
    }

    @Test
    void removeStudentEnrollmentThrowsWhenMissing() {
        when(enrollments.findById(404L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(
                RuntimeException.class,
                () -> service.removeStudentEnrollment(404L)
        );

        assertEquals("Enrollment not found", ex.getMessage());
        verify(enrollments, never()).delete(any(Enrollment.class));
    }
}
