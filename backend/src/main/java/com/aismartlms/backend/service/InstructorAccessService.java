package com.aismartlms.backend.service;

import com.aismartlms.backend.entity.InstructorCourseAssignment;
import com.aismartlms.backend.entity.Role;
import com.aismartlms.backend.entity.Subject;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.exception.AccessDeniedException;
import com.aismartlms.backend.repository.InstructorCourseAssignmentRepository;
import com.aismartlms.backend.repository.SubjectRepository;
import com.aismartlms.backend.repository.UserRepository;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Backend enforcement of the HOD instructor-assignment rules.
 * <p>
 * The React UI hides management buttons for courses an instructor does not
 * own, but that is never enough on its own. Every instructor-facing write
 * endpoint calls into this service so the decision is re-made on the server.
 * When the logged-in instructor is not assigned to the requested
 * course/subject an {@link AccessDeniedException} is raised, which the
 * {@code ApiExceptionHandler} maps to HTTP 403 Forbidden.
 * <p>
 * Rules:
 * <ul>
 *   <li>ADMIN and HOD may manage anything (they are the ones assigning).</li>
 *   <li>INSTRUCTOR may <b>view</b> every course, but may only
 *       <b>manage</b> a course/subject that has an ACTIVE
 *       {@link InstructorCourseAssignment} row pointing at it.</li>
 *   <li>STUDENT may never manage course content.</li>
 * </ul>
 */
@Service
public class InstructorAccessService {

    private final InstructorCourseAssignmentRepository assignments;
    private final UserRepository users;
    private final SubjectRepository subjects;

    public InstructorAccessService(
            InstructorCourseAssignmentRepository assignments,
            UserRepository users,
            SubjectRepository subjects) {

        this.assignments = assignments;
        this.users = users;
        this.subjects = subjects;
    }

    // =========================================================
    // CURRENT USER
    // =========================================================

    /** The user behind the current JWT, or null when anonymous. */
    public User currentUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getName() == null) {
            return null;
        }

        return users.findByEmail(authentication.getName()).orElse(null);
    }

    /** The current user, refusing anonymous requests with 401-style 403. */
    public User requireCurrentUser() {

        User user = currentUser();

        if (user == null) {
            throw new AccessDeniedException("Authentication required");
        }

        return user;
    }

    // =========================================================
    // ROLE HELPERS
    // =========================================================

    public boolean isStaff(User user) {
        return user != null
                && (user.getRole() == Role.ADMIN || user.getRole() == Role.HOD);
    }

    public boolean isInstructor(User user) {
        return user != null && user.getRole() == Role.INSTRUCTOR;
    }

    // =========================================================
    // ASSIGNMENT LOOKUP
    // =========================================================

    /** ACTIVE assignments owned by one instructor. */
    public List<InstructorCourseAssignment> activeAssignments(Long instructorId) {

        if (instructorId == null) {
            return List.of();
        }

        return assignments.findByInstructorIdAndStatus(instructorId, "ACTIVE");
    }

    /** Course ids the instructor may manage (course-wide or via a subject). */
    public Set<Long> manageableCourseIds(Long instructorId) {

        return activeAssignments(instructorId).stream()
                .map(InstructorCourseAssignment::getCourseId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    /** Subject ids explicitly assigned to the instructor. */
    public Set<Long> manageableSubjectIds(Long instructorId) {

        return activeAssignments(instructorId).stream()
                .map(InstructorCourseAssignment::getSubjectId)
                .filter(id -> id != null && id != 0L)
                .collect(Collectors.toSet());
    }

    // =========================================================
    // DECISIONS
    // =========================================================

    /**
     * May this user manage content belonging to {@code courseId}?
     * <p>
     * Staff always can. Instructors need an ACTIVE assignment row for the
     * course, or an ACTIVE subject-level row whose subject belongs to it.
     */
    public boolean canManageCourse(User user, Long courseId) {

        if (user == null || courseId == null) {
            return false;
        }

        if (isStaff(user)) {
            return true;
        }

        if (!isInstructor(user)) {
            return false;
        }

        for (InstructorCourseAssignment assignment : activeAssignments(user.getId())) {

            if (courseId.equals(assignment.getCourseId())) {
                return true;
            }

            // A subject-level row also grants access to its parent course.
            if (assignment.getSubjectId() != null && assignment.getSubjectId() != 0L) {

                Subject subject = subjects.findById(assignment.getSubjectId()).orElse(null);

                if (subject != null
                        && subject.getCourse() != null
                        && courseId.equals(subject.getCourse().getId())) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * May this user manage content belonging to {@code subjectId}?
     * <p>
     * Granted either by a subject-level assignment, or by a course-wide
     * assignment covering the subject's parent course.
     */
    public boolean canManageSubject(User user, Long subjectId) {

        if (user == null || subjectId == null) {
            return false;
        }

        if (isStaff(user)) {
            return true;
        }

        if (!isInstructor(user)) {
            return false;
        }

        Subject subject = subjects.findById(subjectId).orElse(null);

        if (subject == null) {
            return false;
        }

        Long parentId = subject.getCourse() != null
                ? subject.getCourse().getId()
                : null;

        // Subject-level rows win over course-wide rows. If the HOD gave this
        // exact subject to somebody, only that instructor manages it - the
        // other instructor's course-wide row no longer covers it.
        boolean claimedBySomeoneElse = false;

        for (InstructorCourseAssignment assignment : activeAssignments(user.getId())) {

            if (subjectId.equals(assignment.getSubjectId())) {
                return true;
            }
        }

        for (InstructorCourseAssignment assignment : assignments.findAll()) {

            if (!"ACTIVE".equals(assignment.getStatus())) {
                continue;
            }

            if (subjectId.equals(assignment.getSubjectId())
                    && !user.getId().equals(assignment.getInstructorId())) {
                claimedBySomeoneElse = true;
                break;
            }
        }

        if (claimedBySomeoneElse) {
            return false;
        }

        // Otherwise a course-wide assignment covering the parent still counts.
        for (InstructorCourseAssignment assignment : activeAssignments(user.getId())) {

            if (parentId != null && parentId.equals(assignment.getCourseId())) {
                return true;
            }
        }

        return false;
    }

    // =========================================================
    // ENFORCEMENT (throws 403)
    // =========================================================

    /** Reject the request with 403 unless the user may manage the course. */
    public void requireCourseManage(Long courseId) {
        requireCourseManage(requireCurrentUser(), courseId);
    }

    public void requireCourseManage(User user, Long courseId) {

        if (!canManageCourse(user, courseId)) {
            throw new AccessDeniedException(
                    "You are not assigned to this course. Ask your HOD to assign it to you.");
        }
    }

    /** Reject the request with 403 unless the user may manage the subject. */
    public void requireSubjectManage(Long subjectId) {
        requireSubjectManage(requireCurrentUser(), subjectId);
    }

    public void requireSubjectManage(User user, Long subjectId) {

        if (!canManageSubject(user, subjectId)) {
            throw new AccessDeniedException(
                    "You are not assigned to this subject. Ask your HOD to assign it to you.");
        }
    }

    // =========================================================
    // INSTRUCTOR SELF-SERVICE
    // =========================================================

    /**
     * Courses the current instructor manages, as a simple id -> role map.
     * Used by the UI to decide which management buttons to render.
     */
    public Set<Long> myManageableCourseIds() {

        User user = requireCurrentUser();

        if (isStaff(user)) {
            return null; // null == unrestricted, handled by the caller
        }

        return manageableCourseIds(user.getId());
    }
}
