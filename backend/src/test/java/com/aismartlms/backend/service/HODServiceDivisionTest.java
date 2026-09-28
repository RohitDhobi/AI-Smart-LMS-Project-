package com.aismartlms.backend.service;

import com.aismartlms.backend.dto.DivisionResponse;
import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.Division;
import com.aismartlms.backend.entity.Role;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.repository.AnnouncementRepository;
import com.aismartlms.backend.repository.CourseRepository;
import com.aismartlms.backend.repository.DivisionRepository;
import com.aismartlms.backend.repository.EnrollmentRepository;
import com.aismartlms.backend.repository.ExamRepository;
import com.aismartlms.backend.repository.InstructorCourseAssignmentRepository;
import com.aismartlms.backend.repository.QuestionRepository;
import com.aismartlms.backend.repository.QuizRepository;
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
 * A large share of students has no course on their record, which used to make
 * them invisible in the HOD "Manage Students" view and impossible to assign
 * (the backend rejected them with "Student is not enrolled in this course").
 *
 * Assigning such a student to a division must now pull them into that
 * division's course (course + enrollment), while students who already belong
 * to a different course must still be rejected.
 */
class HODServiceDivisionTest {

    private static final Long DIVISION_ID = 1L;
    private static final Long BCA_COURSE_ID = 6L;

    private EnrollmentRepository enrollments;
    private UserRepository users;
    private DivisionRepository divisions;
    private HODService service;

    private Division bcaDivision;
    private User courselessStudent;
    private User otherCourseStudent;

    @BeforeEach
    void setUp() {
        InstructorCourseAssignmentRepository assignments =
                mock(InstructorCourseAssignmentRepository.class);
        CourseRepository courses = mock(CourseRepository.class);
        enrollments = mock(EnrollmentRepository.class);
        QuizRepository quizzes = mock(QuizRepository.class);
        ExamRepository exams = mock(ExamRepository.class);
        QuestionRepository questions = mock(QuestionRepository.class);
        SubjectRepository subjects = mock(SubjectRepository.class);
        users = mock(UserRepository.class);
        AnnouncementRepository announcements = mock(AnnouncementRepository.class);
        divisions = mock(DivisionRepository.class);

        service = new HODService(
                assignments, courses, enrollments, quizzes, exams,
                questions, subjects, users, announcements, divisions);

        Course bca = new Course();
        bca.setId(BCA_COURSE_ID);
        bca.setCourseName("Bachelor of Computer Applications");

        bcaDivision = new Division();
        bcaDivision.setId(DIVISION_ID);
        bcaDivision.setName("Division A");
        bcaDivision.setCode("A");
        bcaDivision.setCourse(bca);
        bcaDivision.setMaxCapacity(60);

        courselessStudent = student(50L, "No Course Yet");
        otherCourseStudent = student(60L, "Already In BBA");

        Course bba = new Course();
        bba.setId(11L);
        bba.setCourseName("Bachelor of Business Administration");
        otherCourseStudent.setCourse(bba);

        when(divisions.findById(DIVISION_ID)).thenReturn(Optional.of(bcaDivision));
        when(users.findById(50L)).thenReturn(Optional.of(courselessStudent));
        when(users.findById(60L)).thenReturn(Optional.of(otherCourseStudent));
        when(enrollments.existsByUserAndCourse(any(), any())).thenReturn(false);
        when(users.countByDivisionId(DIVISION_ID)).thenReturn(0L);
    }

    @Test
    void bulkAssignPullsACourselessStudentIntoTheDivisionsCourse() {
        Map<String, Object> result =
                service.bulkAssignStudents(DIVISION_ID, List.of(50L));

        assertEquals(1, result.get("assigned"));
        assertEquals(List.of(), result.get("skipped"));

        assertNotNull(courselessStudent.getCourse());
        assertEquals(BCA_COURSE_ID, courselessStudent.getCourse().getId());
        assertSame(bcaDivision, courselessStudent.getDivision());

        // enrollment is created so progress / certificate flows keep working
        verify(enrollments).save(any());
        verify(users).save(courselessStudent);
    }

    @Test
    void bulkAssignStillSkipsStudentsWhoBelongToAnotherCourse() {
        Map<String, Object> result =
                service.bulkAssignStudents(DIVISION_ID, List.of(60L));

        assertEquals(0, result.get("assigned"));

        @SuppressWarnings("unchecked")
        List<String> skipped = (List<String>) result.get("skipped");
        assertEquals(1, skipped.size());
        assertTrue(skipped.get(0).contains("different course"));

        assertNull(otherCourseStudent.getDivision());
        verify(enrollments, never()).save(any());
    }

    @Test
    void singleAssignEnrollsACourselessStudentInsteadOfRejectingThem() {
        DivisionResponse view =
                service.assignStudentToDivision(DIVISION_ID, 50L);

        assertNotNull(view);
        assertEquals(DIVISION_ID, view.getId());
        assertEquals(BCA_COURSE_ID, courselessStudent.getCourse().getId());
        assertSame(bcaDivision, courselessStudent.getDivision());
        verify(enrollments).save(any());
    }

    @Test
    void singleAssignRejectsAStudentFromADifferentCourse() {
        RuntimeException ex = assertThrows(
                RuntimeException.class,
                () -> service.assignStudentToDivision(DIVISION_ID, 60L));

        assertEquals("Student is not enrolled in this course", ex.getMessage());
        assertNull(otherCourseStudent.getDivision());
        verify(enrollments, never()).save(any());
    }

    private User student(Long id, String name) {
        User user = new User();
        user.setId(id);
        user.setName(name);
        user.setEmail(id + "@example.com");
        user.setRole(Role.STUDENT);
        user.setActive(true);
        return user;
    }
}
