package com.aismartlms.backend.service;

import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.Exam;
import com.aismartlms.backend.entity.Role;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.exception.AccessDeniedException;
import com.aismartlms.backend.repository.CourseRepository;
import com.aismartlms.backend.repository.ExamRepository;
import com.aismartlms.backend.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Proves the approval workflow is enforced on the server, never only in the
 * React UI: publishing before HOD approval must fail with HTTP 403 and the
 * exact spec message, instructors can never approve, HODs are scoped to
 * their department, and a rejection reason is mandatory.
 */
class ExamApprovalServiceTest {

    private ExamRepository exams;
    private CourseRepository courses;
    private UserRepository users;
    private InstructorAccessService access;
    private ExamApprovalService service;

    private User instructorA;
    private User instructorB;
    private User hod;
    private User admin;

    private Course javaCourse;
    private Course pythonCourse;

    @BeforeEach
    void setUp() {

        exams = mock(ExamRepository.class);
        courses = mock(CourseRepository.class);
        users = mock(UserRepository.class);
        access = mock(InstructorAccessService.class);

        service = new ExamApprovalService(exams, courses, users, access);

        javaCourse = course(1L, "Java Programming");
        pythonCourse = course(2L, "Python Programming");

        instructorA = user(101L, "Dr. Priya Sharma", Role.INSTRUCTOR);
        instructorB = user(102L, "Amit Verma", Role.INSTRUCTOR);
        hod = user(2L, "Head of Department", Role.HOD);
        hod.setCourse(javaCourse); // HOD of the Java department
        admin = user(1L, "Admin", Role.ADMIN);

        // Everyone can manage Java (assignment checks live in
        // InstructorAccessService and are covered by its own test).
        when(access.requireCurrentUser()).thenReturn(instructorA);
        doNothing().when(access).requireCourseManage(any(User.class), any());
        when(access.isStaff(any())).thenAnswer(inv ->
                inv.getArgument(0, User.class).getRole() == Role.ADMIN
                        || inv.getArgument(0, User.class).getRole() == Role.HOD);
        when(access.isInstructor(any())).thenAnswer(inv ->
                inv.getArgument(0, User.class).getRole() == Role.INSTRUCTOR);
    }

    private Course course(Long id, String title) {
        Course course = new Course();
        course.setId(id);
        course.setTitle(title);
        return course;
    }

    private User user(Long id, String name, Role role) {
        User user = new User();
        user.setId(id);
        user.setName(name);
        user.setRole(role);
        return user;
    }

    private Exam exam(Long id, String status, User creator) {
        Exam exam = new Exam();
        exam.setId(id);
        exam.setTitle("Mid Semester Examination");
        exam.setStatus(status);
        exam.setCourse(javaCourse);
        if (creator != null) {
            exam.setCreatedBy(creator.getId());
            exam.setCreatedByName(creator.getName());
        }
        return exam;
    }

    // =====================================================
    // SUBMIT FOR APPROVAL
    // =====================================================

    @Test
    void draftExamCanBeSubmittedByItsOwner() {

        Exam exam = exam(10L, "DRAFT", instructorA);
        when(access.requireCurrentUser()).thenReturn(instructorA);
        when(exams.findById(10L)).thenReturn(Optional.of(exam));
        when(exams.save(any())).thenAnswer(i -> i.getArgument(0));

        Exam result = service.submitForApproval(10L);

        assertEquals("PENDING_HOD_APPROVAL", result.getStatus());
        assertNotNull(result.getSubmittedAt());
    }

    @Test
    void rejectedExamCanBeResubmitted() {

        Exam exam = exam(10L, "REJECTED", instructorA);
        exam.setRejectionReason("Section C has too few 3-mark questions.");
        when(access.requireCurrentUser()).thenReturn(instructorA);
        when(exams.findById(10L)).thenReturn(Optional.of(exam));
        when(exams.save(any())).thenAnswer(i -> i.getArgument(0));

        Exam result = service.submitForApproval(10L);

        assertEquals("PENDING_HOD_APPROVAL", result.getStatus());
        assertNull(result.getRejectionReason(), "old feedback cleared on resubmit");
    }

    @Test
    void instructorCannotSubmitSomeoneElsesExam() {

        Exam exam = exam(10L, "DRAFT", instructorB);
        when(access.requireCurrentUser()).thenReturn(instructorA);
        when(exams.findById(10L)).thenReturn(Optional.of(exam));

        AccessDeniedException thrown = assertThrows(
                AccessDeniedException.class,
                () -> service.submitForApproval(10L));

        assertTrue(thrown.getMessage().contains("you created"));
        verify(exams, never()).save(any());
    }

    @Test
    void pendingExamCannotBeSubmittedTwice() {

        Exam exam = exam(10L, "PENDING_HOD_APPROVAL", instructorA);
        when(access.requireCurrentUser()).thenReturn(instructorA);
        when(exams.findById(10L)).thenReturn(Optional.of(exam));

        assertThrows(RuntimeException.class, () -> service.submitForApproval(10L));
    }

    // =====================================================
    // PUBLISH - THE CRITICAL 403
    // =====================================================

    @Test
    void publishingADraftExamReturns403WithTheSpecMessage() {

        Exam exam = exam(10L, "DRAFT", instructorA);
        when(access.requireCurrentUser()).thenReturn(instructorA);
        when(exams.findById(10L)).thenReturn(Optional.of(exam));

        AccessDeniedException thrown = assertThrows(
                AccessDeniedException.class,
                () -> service.publish(10L));

        assertEquals(
                "Exam must be approved by HOD before publishing.",
                thrown.getMessage());
        verify(exams, never()).save(any());
    }

    @Test
    void publishingAPendingExamReturns403() {

        Exam exam = exam(10L, "PENDING_HOD_APPROVAL", instructorA);
        when(access.requireCurrentUser()).thenReturn(instructorA);
        when(exams.findById(10L)).thenReturn(Optional.of(exam));

        AccessDeniedException thrown = assertThrows(
                AccessDeniedException.class,
                () -> service.publish(10L));

        assertEquals(
                "Exam must be approved by HOD before publishing.",
                thrown.getMessage());
    }

    @Test
    void publishingARejectedExamReturns403() {

        Exam exam = exam(10L, "REJECTED", instructorA);
        when(access.requireCurrentUser()).thenReturn(instructorA);
        when(exams.findById(10L)).thenReturn(Optional.of(exam));

        AccessDeniedException thrown = assertThrows(
                AccessDeniedException.class,
                () -> service.publish(10L));

        assertEquals(
                "Exam must be approved by HOD before publishing.",
                thrown.getMessage());
    }

    @Test
    void approvedExamCanBePublishedByItsOwner() {

        Exam exam = exam(10L, "APPROVED", instructorA);
        when(access.requireCurrentUser()).thenReturn(instructorA);
        when(exams.findById(10L)).thenReturn(Optional.of(exam));
        when(exams.save(any())).thenAnswer(i -> i.getArgument(0));

        Exam result = service.publish(10L);

        assertEquals("PUBLISHED", result.getStatus());
        assertNotNull(result.getPublishedAt());
    }

    @Test
    void instructorCannotPublishAnotherInstructorsExam() {

        Exam exam = exam(10L, "APPROVED", instructorB);
        when(access.requireCurrentUser()).thenReturn(instructorA);
        when(exams.findById(10L)).thenReturn(Optional.of(exam));

        assertThrows(AccessDeniedException.class, () -> service.publish(10L));
        verify(exams, never()).save(any());
    }

    // =====================================================
    // APPROVE
    // =====================================================

    @Test
    void hodApprovesPendingExamAndRecordsTheDecision() {

        Exam exam = exam(10L, "PENDING_HOD_APPROVAL", instructorA);
        when(access.requireCurrentUser()).thenReturn(hod);
        when(exams.findById(10L)).thenReturn(Optional.of(exam));
        when(exams.save(any())).thenAnswer(i -> i.getArgument(0));

        Exam result = service.approve(10L);

        assertEquals("APPROVED", result.getStatus());
        assertEquals(hod.getId(), result.getApprovedBy());
        assertEquals(hod.getName(), result.getApprovedByName());
        assertNotNull(result.getApprovedAt());
    }

    @Test
    void instructorCanNeverApproveAnExam() {

        Exam exam = exam(10L, "PENDING_HOD_APPROVAL", instructorB);
        when(access.requireCurrentUser()).thenReturn(instructorA);
        when(exams.findById(10L)).thenReturn(Optional.of(exam));

        AccessDeniedException thrown = assertThrows(
                AccessDeniedException.class,
                () -> service.approve(10L));

        assertTrue(thrown.getMessage().contains("Only the HOD"));
        verify(exams, never()).save(any());
    }

    @Test
    void nobodyApprovesTheirOwnExam() {

        // An HOD who somehow created the exam still cannot approve it.
        Exam exam = exam(10L, "PENDING_HOD_APPROVAL", hod);
        when(access.requireCurrentUser()).thenReturn(hod);
        when(exams.findById(10L)).thenReturn(Optional.of(exam));

        AccessDeniedException thrown = assertThrows(
                AccessDeniedException.class,
                () -> service.approve(10L));

        assertTrue(thrown.getMessage().contains("your own exam"));
        verify(exams, never()).save(any());
    }

    @Test
    void examCannotBeApprovedTwice() {

        Exam exam = exam(10L, "APPROVED", instructorA);
        when(access.requireCurrentUser()).thenReturn(hod);
        when(exams.findById(10L)).thenReturn(Optional.of(exam));

        assertThrows(RuntimeException.class, () -> service.approve(10L));
    }

    @Test
    void hodCannotApproveAnExamOutsideTheirDepartment() {

        Exam exam = exam(10L, "PENDING_HOD_APPROVAL", instructorA);
        exam.setCourse(pythonCourse); // Python exam, Java HOD
        when(access.requireCurrentUser()).thenReturn(hod);
        when(exams.findById(10L)).thenReturn(Optional.of(exam));

        AccessDeniedException thrown = assertThrows(
                AccessDeniedException.class,
                () -> service.approve(10L));

        assertTrue(thrown.getMessage().contains("outside your department"));
        verify(exams, never()).save(any());
    }

    // =====================================================
    // REJECT
    // =====================================================

    @Test
    void rejectionRequiresAReason() {

        Exam exam = exam(10L, "PENDING_HOD_APPROVAL", instructorA);
        when(access.requireCurrentUser()).thenReturn(hod);
        when(exams.findById(10L)).thenReturn(Optional.of(exam));

        RuntimeException thrown = assertThrows(
                RuntimeException.class,
                () -> service.reject(10L, "   "));

        assertTrue(thrown.getMessage().contains("reason is required"));
        verify(exams, never()).save(any());
    }

    @Test
    void hodRejectsWithReasonAndFeedbackIsStored() {

        Exam exam = exam(10L, "PENDING_HOD_APPROVAL", instructorA);
        when(access.requireCurrentUser()).thenReturn(hod);
        when(exams.findById(10L)).thenReturn(Optional.of(exam));
        when(exams.save(any())).thenAnswer(i -> i.getArgument(0));

        Exam result = service.reject(
                10L, "Section C contains insufficient 3-mark questions.");

        assertEquals("REJECTED", result.getStatus());
        assertEquals(
                "Section C contains insufficient 3-mark questions.",
                result.getRejectionReason());
    }

    @Test
    void instructorCannotRejectAnExam() {

        Exam exam = exam(10L, "PENDING_HOD_APPROVAL", instructorA);
        when(access.requireCurrentUser()).thenReturn(instructorB);
        when(exams.findById(10L)).thenReturn(Optional.of(exam));

        assertThrows(AccessDeniedException.class,
                () -> service.reject(10L, "nope"));
        verify(exams, never()).save(any());
    }

    // =====================================================
    // ADMIN OVERRIDE
    // =====================================================

    @Test
    void adminCanOverrideStatus() {

        Exam exam = exam(10L, "DRAFT", instructorA);
        when(access.requireCurrentUser()).thenReturn(admin);
        when(exams.findById(10L)).thenReturn(Optional.of(exam));
        when(exams.save(any())).thenAnswer(i -> i.getArgument(0));

        Exam result = service.overrideStatus(10L, "PUBLISHED");

        assertEquals("PUBLISHED", result.getStatus());
        assertNotNull(result.getPublishedAt());
    }

    @Test
    void nonAdminCannotOverrideStatus() {

        when(access.requireCurrentUser()).thenReturn(hod);

        AccessDeniedException thrown = assertThrows(
                AccessDeniedException.class,
                () -> service.overrideStatus(10L, "PUBLISHED"));

        assertTrue(thrown.getMessage().contains("Only an admin"));
        verify(exams, never()).save(any());
    }

    @Test
    void overrideRejectsUnknownStatus() {

        when(access.requireCurrentUser()).thenReturn(admin);
        when(exams.findById(10L)).thenReturn(Optional.of(
                exam(10L, "DRAFT", instructorA)));

        assertThrows(RuntimeException.class,
                () -> service.overrideStatus(10L, "WHATEVER"));
    }

    // =====================================================
    // DEPARTMENT-SCOPED LISTS
    // =====================================================

    @Test
    void hodOnlySeesTheirDepartmentsPendingExams() {

        Exam javaExam = exam(10L, "PENDING_HOD_APPROVAL", instructorA);
        Exam pythonExam = exam(11L, "PENDING_HOD_APPROVAL", instructorB);
        pythonExam.setCourse(pythonCourse);

        when(exams.findByStatusOrderByCreatedAtDesc("PENDING_HOD_APPROVAL"))
                .thenReturn(List.of(javaExam, pythonExam));

        List<Exam> pending = service.pendingApprovalsFor(hod);

        assertEquals(1, pending.size());
        assertEquals(10L, pending.get(0).getId());
    }

    @Test
    void adminSeesEveryPendingExam() {

        Exam javaExam = exam(10L, "PENDING_HOD_APPROVAL", instructorA);
        Exam pythonExam = exam(11L, "PENDING_HOD_APPROVAL", instructorB);
        pythonExam.setCourse(pythonCourse);

        when(exams.findByStatusOrderByCreatedAtDesc("PENDING_HOD_APPROVAL"))
                .thenReturn(List.of(javaExam, pythonExam));

        List<Exam> pending = service.pendingApprovalsFor(admin);

        assertEquals(2, pending.size());
    }

    @Test
    void instructorOnlySeesTheirOwnExams() {

        when(exams.findByCreatedByOrderByCreatedAtDesc(101L))
                .thenReturn(List.of(exam(10L, "DRAFT", instructorA)));

        List<Exam> mine = service.myExams(instructorA);

        assertEquals(1, mine.size());
        verify(exams, never()).findAll();
    }
}
