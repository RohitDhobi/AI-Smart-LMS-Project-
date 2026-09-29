package com.aismartlms.backend.service;

import com.aismartlms.backend.entity.Course;
import com.aismartlms.backend.entity.Exam;
import com.aismartlms.backend.entity.Role;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.exception.AccessDeniedException;
import com.aismartlms.backend.repository.CourseRepository;
import com.aismartlms.backend.repository.ExamRepository;
import com.aismartlms.backend.repository.UserRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

/**
 * Backend enforcement of the exam approval workflow.
 *
 * Workflow:
 *   DRAFT -> PENDING_HOD_APPROVAL -> APPROVED -> PUBLISHED
 *                      \\-> REJECTED -> (edit) -> PENDING_HOD_APPROVAL
 *
 * The React UI only hides buttons; every transition is re-checked here so a
 * hand-crafted HTTP request cannot skip the HOD. All failures raise
 * {@link AccessDeniedException} (HTTP 403) or a plain RuntimeException
 * (HTTP 400 via the ApiExceptionHandler).
 *
 * Rules enforced:
 *   1. An instructor may only manage exams for a course/subject the HOD
 *      assigned to them (delegated to InstructorAccessService).
 *   2. An instructor may only submit/publish exams they created.
 *   3. Publishing requires status == APPROVED, otherwise HTTP 403 with
 *      "Exam must be approved by HOD before publishing."
 *   4. Only HOD/ADMIN may approve or reject, and only for exams inside
 *      their department (course).
 *   5. Nobody may approve their own exam (an instructor can never approve;
 *      an HOD who created the exam cannot approve it either).
 */
@Service
public class ExamApprovalService {

    public static final String DRAFT = "DRAFT";
    public static final String PENDING_HOD_APPROVAL = "PENDING_HOD_APPROVAL";
    public static final String REJECTED = "REJECTED";
    public static final String APPROVED = "APPROVED";
    public static final String PUBLISHED = "PUBLISHED";
    public static final String COMPLETED = "COMPLETED";

    public static final String NOT_APPROVED_MESSAGE =
            "Exam must be approved by HOD before publishing.";

    private final ExamRepository exams;
    private final CourseRepository courses;
    private final UserRepository users;
    private final InstructorAccessService access;

    public ExamApprovalService(
            ExamRepository exams,
            CourseRepository courses,
            UserRepository users,
            InstructorAccessService access) {
        this.exams = exams;
        this.courses = courses;
        this.users = users;
        this.access = access;
    }

    // =========================================================
    // CURRENT USER
    // =========================================================

    public User currentUser() {
        return access.requireCurrentUser();
    }

    // =========================================================
    // INSTRUCTOR: SUBMIT FOR HOD APPROVAL
    // =========================================================

    /**
     * DRAFT or REJECTED -> PENDING_HOD_APPROVAL.
     * Only the instructor who created the exam may submit it, and only if
     * the HOD assigned that course/subject to them.
     */
    public Exam submitForApproval(Long examId) {

        User user = currentUser();
        Exam exam = requireExam(examId);

        requireAssignedToExamCourse(user, exam);
        requireOwnerOrStaff(user, exam);

        String status = normalizeStatus(exam);

        if (PENDING_HOD_APPROVAL.equals(status)) {
            throw new RuntimeException("Exam is already pending HOD approval.");
        }
        if (!DRAFT.equals(status) && !REJECTED.equals(status)) {
            throw new RuntimeException(
                    "Only draft or rejected exams can be submitted for approval. Current status: "
                            + exam.getStatus());
        }

        exam.setStatus(PENDING_HOD_APPROVAL);
        exam.setSubmittedAt(LocalDateTime.now());
        // A resubmission starts a fresh decision - clear the old feedback.
        exam.setRejectionReason(null);

        return exams.save(exam);
    }

    // =========================================================
    // HOD: APPROVE
    // =========================================================

    /**
     * PENDING_HOD_APPROVAL -> APPROVED. Records who approved and when.
     * The approver must be HOD/ADMIN, belong to the exam's department and
     * must not be the exam's creator.
     */
    public Exam approve(Long examId) {

        User user = currentUser();
        Exam exam = requireExam(examId);

        requireApprover(user, exam);
        requireDepartmentScope(user, exam);
        requireNotSelfApproved(user, exam);

        if (!PENDING_HOD_APPROVAL.equals(normalizeStatus(exam))) {
            throw new RuntimeException(
                    "Only exams pending HOD approval can be approved. Current status: "
                            + exam.getStatus());
        }

        exam.setStatus(APPROVED);
        exam.setApprovedBy(user.getId());
        exam.setApprovedByName(user.getName());
        exam.setApprovedAt(LocalDateTime.now());
        exam.setRejectionReason(null);

        return exams.save(exam);
    }

    // =========================================================
    // HOD: REJECT (reason mandatory)
    // =========================================================

    /**
     * PENDING_HOD_APPROVAL -> REJECTED with a mandatory explanation the
     * instructor will see as "HOD Feedback".
     */
    public Exam reject(Long examId, String reason) {

        User user = currentUser();
        Exam exam = requireExam(examId);

        requireApprover(user, exam);
        requireDepartmentScope(user, exam);
        requireNotSelfApproved(user, exam);

        if (reason == null || reason.trim().isEmpty()) {
            throw new RuntimeException("A rejection reason is required.");
        }

        if (!PENDING_HOD_APPROVAL.equals(normalizeStatus(exam))) {
            throw new RuntimeException(
                    "Only exams pending HOD approval can be rejected. Current status: "
                            + exam.getStatus());
        }

        exam.setStatus(REJECTED);
        exam.setRejectionReason(reason.trim());

        return exams.save(exam);
    }

    // =========================================================
    // INSTRUCTOR: PUBLISH (only after approval)
    // =========================================================

    /**
     * APPROVED -> PUBLISHED. HTTP 403 with NOT_APPROVED_MESSAGE for every
     * other status (DRAFT / PENDING_HOD_APPROVAL / REJECTED).
     */
    public Exam publish(Long examId) {

        User user = currentUser();
        Exam exam = requireExam(examId);

        requireAssignedToExamCourse(user, exam);
        requireOwnerOrStaff(user, exam);

        String status = normalizeStatus(exam);

        if (PUBLISHED.equals(status)) {
            return exam; // idempotent
        }

        if (!APPROVED.equals(status)) {
            throw new AccessDeniedException(NOT_APPROVED_MESSAGE);
        }

        exam.setStatus(PUBLISHED);
        exam.setPublishedAt(LocalDateTime.now());

        return exams.save(exam);
    }

    // =========================================================
    // ADMIN: OVERRIDE STATUS
    // =========================================================

    /** Admin-only escape hatch ("Override/manage exam status if required"). */
    public Exam overrideStatus(Long examId, String newStatus) {

        User user = currentUser();

        if (user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only an admin can override exam status.");
        }

        Exam exam = requireExam(examId);

        if (newStatus == null || newStatus.trim().isEmpty()) {
            throw new RuntimeException("Status is required.");
        }

        String status = newStatus.trim().toUpperCase();

        switch (status) {
            case DRAFT:
            case PENDING_HOD_APPROVAL:
            case REJECTED:
            case APPROVED:
            case PUBLISHED:
            case COMPLETED:
                break;
            default:
                throw new RuntimeException("Unknown exam status: " + status);
        }

        exam.setStatus(status);
        if (APPROVED.equals(status) && exam.getApprovedAt() == null) {
            exam.setApprovedBy(user.getId());
            exam.setApprovedByName(user.getName());
            exam.setApprovedAt(LocalDateTime.now());
        }
        if (PUBLISHED.equals(status) && exam.getPublishedAt() == null) {
            exam.setPublishedAt(LocalDateTime.now());
        }

        return exams.save(exam);
    }

    // =========================================================
    // READ HELPERS (department-scoped for HODs)
    // =========================================================

    /** Every exam waiting for a decision, scoped to the HOD's department. */
    public List<Exam> pendingApprovalsFor(User hod) {
        return scopeToDepartment(hod, exams.findByStatusOrderByCreatedAtDesc(PENDING_HOD_APPROVAL));
    }

    /**
     * All workflow-relevant exams for the approvals screen. When
     * {@code status} is null every status is returned (still scoped).
     */
    public List<Exam> approvalsFor(User hod, String status) {
        List<Exam> list = status == null || status.trim().isEmpty()
                ? exams.findAll()
                : exams.findByStatusOrderByCreatedAtDesc(status.trim().toUpperCase());
        return scopeToDepartment(hod, list);
    }

    /** Exams this instructor created - the "My Exams" dashboard. */
    public List<Exam> myExams(User instructor) {
        if (access.isStaff(instructor)) {
            return exams.findAll();
        }
        return exams.findByCreatedByOrderByCreatedAtDesc(instructor.getId());
    }

    // =========================================================
    // SECURITY CHECKS
    // =========================================================

    private Exam requireExam(Long examId) {
        return exams.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));
    }

    /**
     * Rule 1: the instructor must be assigned to the exam's course by the
     * HOD (staff are unrestricted). HTTP 403 otherwise.
     */
    private void requireAssignedToExamCourse(User user, Exam exam) {
        if (exam.getCourse() == null || exam.getCourse().getId() == null) {
            return; // legacy exam without a course - nothing to scope
        }
        access.requireCourseManage(user, exam.getCourse().getId());
    }

    /**
     * Rule 2: instructors may only touch their own exams. Staff (HOD/ADMIN)
     * may touch any. An exam created before this feature (createdBy == null)
     * is treated as legacy and falls back to the course-assignment check
     * already performed by {@link #requireAssignedToExamCourse}.
     */
    private void requireOwnerOrStaff(User user, Exam exam) {
        if (access.isStaff(user)) {
            return;
        }
        if (exam.getCreatedBy() == null) {
            return; // legacy exam: course assignment (rule 1) is the gate
        }
        if (!Objects.equals(exam.getCreatedBy(), user.getId())) {
            throw new AccessDeniedException(
                    "You can only manage exams you created.");
        }
    }

    /** Rule 5a: instructors can never approve or reject anything. */
    private void requireApprover(User user, Exam exam) {
        if (user.getRole() != Role.HOD && user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException(
                    "Only the HOD can approve or reject exams.");
        }
    }

    /** Rule 5b: nobody approves their own exam. */
    private void requireNotSelfApproved(User user, Exam exam) {
        if (exam.getCreatedBy() != null
                && Objects.equals(exam.getCreatedBy(), user.getId())) {
            throw new AccessDeniedException(
                    "You cannot approve your own exam.");
        }
    }

    /**
     * Rule 4: an HOD only manages exams from courses in their department.
     * ADMIN is unrestricted. An HOD without any assigned course (legacy
     * account) sees everything, matching the rest of the HOD panel.
     */
    private void requireDepartmentScope(User user, Exam exam) {
        if (user.getRole() == Role.ADMIN) {
            return;
        }
        if (exam.getCourse() == null || exam.getCourse().getId() == null) {
            return;
        }
        Long department = departmentCourseId(user);
        if (department == null) {
            return; // HOD not bound to a course yet - treat as all-departments
        }
        if (!department.equals(exam.getCourse().getId())) {
            throw new AccessDeniedException(
                    "This exam belongs to a course outside your department.");
        }
    }

    /** Same filter as {@link #requireDepartmentScope}, applied to a list. */
    private List<Exam> scopeToDepartment(User user, List<Exam> list) {
        if (user.getRole() == Role.ADMIN) {
            return list;
        }
        Long department = departmentCourseId(user);
        if (department == null) {
            return list;
        }
        return list.stream()
                .filter(e -> e.getCourse() == null
                        || e.getCourse().getId() == null
                        || department.equals(e.getCourse().getId()))
                .toList();
    }

    /**
     * The course an HOD is head of: their profile course if set, otherwise
     * the first course they were ever assigned to as instructor-owner.
     */
    private Long departmentCourseId(User hod) {
        if (hod.getCourse() != null && hod.getCourse().getId() != null) {
            return hod.getCourse().getId();
        }
        return null;
    }

    /** Null-safe status lookup for legacy rows. */
    private String normalizeStatus(Exam exam) {
        return exam.getStatus() == null ? "" : exam.getStatus().trim().toUpperCase();
    }

    /** Convenience used by controllers when they need the course name. */
    public String courseName(Exam exam) {
        Course course = exam.getCourse();
        return course == null ? null : course.getTitle();
    }

    /** Resolves a user display name without exposing the entity. */
    public String userName(Long userId) {
        if (userId == null) {
            return null;
        }
        return users.findById(userId).map(User::getName).orElse(null);
    }
}
