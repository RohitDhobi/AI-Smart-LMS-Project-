package com.aismartlms.backend.service;

import com.aismartlms.backend.dto.HODRequest;
import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.InstructorCourseAssignment;
import com.aismartlms.backend.entity.Role;
import com.aismartlms.backend.entity.Subject;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.repository.AcademicYearRepository;
import com.aismartlms.backend.repository.AnnouncementRepository;
import com.aismartlms.backend.repository.CourseRepository;
import com.aismartlms.backend.repository.DivisionRepository;
import com.aismartlms.backend.repository.EnrollmentRepository;
import com.aismartlms.backend.repository.ExamRepository;
import com.aismartlms.backend.repository.InstructorCourseAssignmentRepository;
import com.aismartlms.backend.repository.QuestionRepository;
import com.aismartlms.backend.repository.QuizRepository;
import com.aismartlms.backend.repository.SemesterRepository;
import com.aismartlms.backend.repository.SubjectRepository;
import com.aismartlms.backend.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * The HOD "Change" button on the Instructor Assignment page reported success
 * while the backend silently ignored {@code instructorId}, so the row kept its
 * old instructor forever. Updating an assignment must now swap the instructor
 * (with a duplicate guard scoped to the row's subject / course), creating a
 * subject-level row must no longer be blocked by an unrelated course-wide
 * assignment, and the subject listing must never let another subject's row
 * leak into a course-wide fallback.
 */
class HODServiceAssignmentTest {

    private static final Long BCA_COURSE_ID = 6L;
    private static final Long SUBJECT_ONE = 1L;

    private InstructorCourseAssignmentRepository assignments;
    private SubjectRepository subjects;
    private UserRepository users;
    private HODService service;

    @BeforeEach
    void setUp() {
        assignments = mock(InstructorCourseAssignmentRepository.class);
        CourseRepository courses = mock(CourseRepository.class);
        EnrollmentRepository enrollments = mock(EnrollmentRepository.class);
        QuizRepository quizzes = mock(QuizRepository.class);
        ExamRepository exams = mock(ExamRepository.class);
        QuestionRepository questions = mock(QuestionRepository.class);
        subjects = mock(SubjectRepository.class);
        users = mock(UserRepository.class);
        AnnouncementRepository announcements = mock(AnnouncementRepository.class);
        DivisionRepository divisions = mock(DivisionRepository.class);
        SemesterRepository semesters = mock(SemesterRepository.class);
        AcademicYearRepository academicYears = mock(AcademicYearRepository.class);

        service = new HODService(
                assignments, courses, enrollments, quizzes, exams,
                questions, subjects, users, announcements, divisions,
                semesters, academicYears);

        when(assignments.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void updateAssignmentActuallyChangesTheInstructor() {
        InstructorCourseAssignment row = assignment(5L, 22L, BCA_COURSE_ID, SUBJECT_ONE);
        when(assignments.findById(5L)).thenReturn(Optional.of(row));
        when(assignments.findByInstructorIdAndStatus(19L, "ACTIVE")).thenReturn(List.of());

        HODRequest request = new HODRequest();
        request.setInstructorId(19L);
        request.setCourseId(BCA_COURSE_ID);
        request.setSubjectId(SUBJECT_ONE);

        InstructorCourseAssignment saved = service.updateAssignment(5L, request);

        assertEquals(19L, saved.getInstructorId());
        assertEquals(SUBJECT_ONE, saved.getSubjectId());
        verify(assignments).save(row);
    }

    @Test
    void updateRejectsAnInstructorWhoAlreadyCoversThatSubject() {
        when(assignments.findById(5L))
                .thenReturn(Optional.of(assignment(5L, 22L, BCA_COURSE_ID, SUBJECT_ONE)));
        when(assignments.findByInstructorIdAndStatus(19L, "ACTIVE"))
                .thenReturn(List.of(assignment(9L, 19L, BCA_COURSE_ID, SUBJECT_ONE)));

        HODRequest request = new HODRequest();
        request.setInstructorId(19L);
        request.setCourseId(BCA_COURSE_ID);
        request.setSubjectId(SUBJECT_ONE);

        RuntimeException ex = assertThrows(
                RuntimeException.class,
                () -> service.updateAssignment(5L, request));

        assertTrue(ex.getMessage().contains("already assigned to this subject"));
        verify(assignments, never()).save(any());
    }

    @Test
    void updateRejectsAnInstructorWhoIsAlreadyCourseWideOnThatCourse() {
        when(assignments.findById(7L))
                .thenReturn(Optional.of(assignment(7L, 22L, BCA_COURSE_ID, null)));
        when(assignments.findByInstructorIdAndStatus(19L, "ACTIVE"))
                .thenReturn(List.of(assignment(8L, 19L, BCA_COURSE_ID, null)));

        HODRequest request = new HODRequest();
        request.setInstructorId(19L);
        request.setCourseId(BCA_COURSE_ID);

        RuntimeException ex = assertThrows(
                RuntimeException.class,
                () -> service.updateAssignment(7L, request));

        assertTrue(ex.getMessage().contains("already assigned to this course"));
        verify(assignments, never()).save(any());
    }

    @Test
    void subjectLevelCreateIsAllowedForAnotherSubjectOfTheSameCourse() {
        // The instructor already owns subject 2 of this course; assigning them
        // to subject 1 as well must not be treated as a duplicate.
        when(assignments.findByInstructorIdAndStatus(19L, "ACTIVE"))
                .thenReturn(List.of(assignment(5L, 19L, BCA_COURSE_ID, 2L)));
        when(subjects.findById(SUBJECT_ONE)).thenReturn(Optional.of(subject(SUBJECT_ONE)));

        HODRequest request = new HODRequest();
        request.setInstructorId(19L);
        request.setCourseId(BCA_COURSE_ID);
        request.setSubjectId(SUBJECT_ONE);

        InstructorCourseAssignment created = service.createAssignment(request);

        assertEquals(19L, created.getInstructorId());
        assertEquals(SUBJECT_ONE, created.getSubjectId());
        assertEquals(BCA_COURSE_ID, created.getCourseId());
        assertEquals("ACTIVE", created.getStatus());
    }

    @Test
    void courseWideCreateStillRejectsASecondCourseWideRow() {
        when(assignments.findByInstructorIdAndStatus(19L, "ACTIVE"))
                .thenReturn(List.of(assignment(3L, 19L, BCA_COURSE_ID, null)));

        HODRequest request = new HODRequest();
        request.setInstructorId(19L);
        request.setCourseId(BCA_COURSE_ID);

        RuntimeException ex = assertThrows(
                RuntimeException.class,
                () -> service.createAssignment(request));

        assertTrue(ex.getMessage().contains("already assigned to this course"));
        verify(assignments, never()).save(any());
    }

    @Test
    void subjectListingFallsBackToTheCourseWideRowNotAnotherSubjectsRow() {
        Subject first = subject(SUBJECT_ONE);
        Subject second = subject(2L);
        when(subjects.findAll()).thenReturn(List.of(first, second));

        // Subject 1 has its own (changed) instructor; the course-wide row still
        // has the original one.
        InstructorCourseAssignment subjectRow = assignment(5L, 19L, BCA_COURSE_ID, SUBJECT_ONE);
        InstructorCourseAssignment courseWide = assignment(3L, 22L, BCA_COURSE_ID, null);

        when(assignments.findBySubjectIdAndStatus(SUBJECT_ONE, "ACTIVE"))
                .thenReturn(List.of(subjectRow));
        when(assignments.findBySubjectIdAndStatus(2L, "ACTIVE"))
                .thenReturn(List.of());
        // Deliberately list the subject-level row first: the fallback must skip it.
        when(assignments.findByCourseIdAndStatus(BCA_COURSE_ID, "ACTIVE"))
                .thenReturn(List.of(subjectRow, courseWide));

        when(users.findById(19L)).thenReturn(Optional.of(instructor(19L, "Dr. Priya Sharma")));
        when(users.findById(22L)).thenReturn(Optional.of(instructor(22L, "Prof. Suresh Patel")));

        List<Map<String, Object>> view = service.getSubjects();

        assertEquals(2, view.size());

        // Subject 1 shows its own instructor...
        assertEquals("Dr. Priya Sharma", view.get(0).get("assignedInstructor"));
        assertEquals(19L, view.get(0).get("assignedInstructorId"));

        // ...while subject 2 keeps the course-wide instructor.
        assertEquals("Prof. Suresh Patel", view.get(1).get("assignedInstructor"));
        assertEquals(22L, view.get(1).get("assignedInstructorId"));
    }

    private InstructorCourseAssignment assignment(
            Long id, Long instructorId, Long courseId, Long subjectId) {

        InstructorCourseAssignment row =
                new InstructorCourseAssignment(instructorId, courseId, subjectId, null);
        row.setId(id);
        return row;
    }

    private Subject subject(Long id) {
        Course course = new Course();
        course.setId(BCA_COURSE_ID);
        course.setCourseName("Bachelor of Computer Applications");

        Subject subject = new Subject();
        subject.setId(id);
        subject.setSubjectName("Subject " + id);
        subject.setCourse(course);
        return subject;
    }

    private User instructor(Long id, String name) {
        User user = new User();
        user.setId(id);
        user.setName(name);
        user.setEmail(id + "@example.com");
        user.setRole(Role.INSTRUCTOR);
        user.setActive(true);
        return user;
    }
}
