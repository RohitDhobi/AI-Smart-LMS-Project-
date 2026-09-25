package com.aismartlms.backend.service;

import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.InstructorCourseAssignment;
import com.aismartlms.backend.entity.Role;
import com.aismartlms.backend.entity.Subject;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.exception.AccessDeniedException;
import com.aismartlms.backend.repository.InstructorCourseAssignmentRepository;
import com.aismartlms.backend.repository.SubjectRepository;
import com.aismartlms.backend.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Proves the backend re-checks HOD assignments on its own.
 * Hiding buttons in React is never enough: an instructor who is not assigned
 * to a course/subject must receive HTTP 403 from the server.
 */
class InstructorAccessServiceTest {

    private InstructorCourseAssignmentRepository assignments;
    private UserRepository users;
    private SubjectRepository subjects;
    private InstructorAccessService service;

    private User instructorA;
    private User instructorB;
    private User admin;
    private User hod;
    private User student;

    private static final Long JAVA_COURSE = 1L;
    private static final Long PYTHON_COURSE = 2L;
    private static final Long DBMS_SUBJECT = 10L;
    private static final Long DBMS_COURSE = 3L;

    @BeforeEach
    void setUp() {

        assignments = mock(InstructorCourseAssignmentRepository.class);
        users = mock(UserRepository.class);
        subjects = mock(SubjectRepository.class);

        service = new InstructorAccessService(assignments, users, subjects);

        instructorA = user(101L, "Instructor A", Role.INSTRUCTOR);
        instructorB = user(102L, "Instructor B", Role.INSTRUCTOR);
        admin = user(1L, "Admin", Role.ADMIN);
        hod = user(2L, "HOD", Role.HOD);
        student = user(3L, "Student", Role.STUDENT);

        // Instructor A is assigned to Java (course) and DBMS (subject).
        when(assignments.findByInstructorIdAndStatus(101L, "ACTIVE")).thenReturn(List.of(
                row(101L, JAVA_COURSE, null),
                row(101L, DBMS_COURSE, DBMS_SUBJECT)
        ));

        // Instructor B has no assignments at all.
        when(assignments.findByInstructorIdAndStatus(102L, "ACTIVE"))
                .thenReturn(List.of());

        // Nobody holds a subject-level claim on DBMS besides A.
        when(assignments.findAll()).thenReturn(List.of(
                row(101L, DBMS_COURSE, DBMS_SUBJECT)
        ));

        // Default: unknown subjects resolve to nothing. Stubbed before the
        // specific case below so the specific stub wins.
        when(subjects.findById(anyLong())).thenReturn(Optional.empty());

        // DBMS subject belongs to course 3.
        Subject dbms = new Subject();
        dbms.setId(DBMS_SUBJECT);
        dbms.setSubjectName("Database Management System");

        Course dbmsCourse = new Course();
        dbmsCourse.setId(DBMS_COURSE);
        dbms.setCourse(dbmsCourse);

        when(subjects.findById(DBMS_SUBJECT)).thenReturn(Optional.of(dbms));
    }

    private User user(Long id, String name, Role role) {
        User user = new User();
        user.setId(id);
        user.setName(name);
        user.setRole(role);
        return user;
    }

    private InstructorCourseAssignment row(Long instructorId, Long courseId, Long subjectId) {
        InstructorCourseAssignment row =
                new InstructorCourseAssignment(instructorId, courseId, subjectId, null);
        row.setStatus("ACTIVE");
        return row;
    }

    // =====================================================
    // COURSE LEVEL
    // =====================================================

    @Test
    void instructorWithAssignmentMayManageCourse() {
        assertTrue(service.canManageCourse(instructorA, JAVA_COURSE));
        assertDoesNotThrow(() -> service.requireCourseManage(instructorA, JAVA_COURSE));
    }

    @Test
    void unassignedInstructorIsRejectedWith403() {

        assertFalse(service.canManageCourse(instructorB, JAVA_COURSE));

        AccessDeniedException thrown = assertThrows(
                AccessDeniedException.class,
                () -> service.requireCourseManage(instructorB, JAVA_COURSE));

        assertTrue(thrown.getMessage().contains("not assigned"));
    }

    @Test
    void instructorMayNotManageAnotherInstructorsCourse() {
        assertFalse(service.canManageCourse(instructorA, PYTHON_COURSE));
        assertThrows(
                AccessDeniedException.class,
                () -> service.requireCourseManage(instructorA, PYTHON_COURSE));
    }

    @Test
    void subjectLevelAssignmentAlsoGrantsTheParentCourse() {
        assertTrue(service.canManageCourse(instructorA, DBMS_COURSE));
    }

    // =====================================================
    // SUBJECT LEVEL
    // =====================================================

    @Test
    void assignedInstructorMayManageSubject() {
        assertTrue(service.canManageSubject(instructorA, DBMS_SUBJECT));
        assertDoesNotThrow(() -> service.requireSubjectManage(instructorA, DBMS_SUBJECT));
    }

    @Test
    void otherInstructorIsRejectedForThatSubject() {

        assertFalse(service.canManageSubject(instructorB, DBMS_SUBJECT));

        assertThrows(
                AccessDeniedException.class,
                () -> service.requireSubjectManage(instructorB, DBMS_SUBJECT));
    }

    // =====================================================
    // ROLES
    // =====================================================

    @Test
    void adminAndHodMayManageAnything() {

        assertTrue(service.canManageCourse(admin, JAVA_COURSE));
        assertTrue(service.canManageCourse(admin, PYTHON_COURSE));
        assertTrue(service.canManageCourse(hod, PYTHON_COURSE));
        assertTrue(service.canManageSubject(hod, DBMS_SUBJECT));

        assertDoesNotThrow(() -> service.requireCourseManage(hod, PYTHON_COURSE));
    }

    @Test
    void studentMayNeverManageCourseContent() {

        assertFalse(service.canManageCourse(student, JAVA_COURSE));

        assertThrows(
                AccessDeniedException.class,
                () -> service.requireCourseManage(student, JAVA_COURSE));
    }

    @Test
    void anonymousCallerCannotManageAnything() {
        assertThrows(
                AccessDeniedException.class,
                () -> service.requireCourseManage(JAVA_COURSE));
    }

    // =====================================================
    // ASSIGNED-ID SETS USED BY THE UI
    // =====================================================

    @Test
    void manageableIdsReflectActiveAssignmentsOnly() {

        assertEquals(
                java.util.Set.of(JAVA_COURSE, DBMS_COURSE),
                service.manageableCourseIds(101L));

        assertEquals(
                java.util.Set.of(DBMS_SUBJECT),
                service.manageableSubjectIds(101L));

        assertTrue(service.manageableCourseIds(102L).isEmpty());
    }
}
