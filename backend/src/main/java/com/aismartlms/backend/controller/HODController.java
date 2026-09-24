package com.aismartlms.backend.controller;

import com.aismartlms.backend.dto.HODAssignmentView;
import com.aismartlms.backend.dto.HODDashboardView;
import com.aismartlms.backend.dto.HODRequest;
import com.aismartlms.backend.entity.InstructorCourseAssignment;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.exception.AccessDeniedException;
import com.aismartlms.backend.repository.InstructorCourseAssignmentRepository;
import com.aismartlms.backend.repository.UserRepository;
import com.aismartlms.backend.service.HODService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * HOD (Head of Department) REST & HTML endpoints.
 * <p>
 * All routes live under /api/hod to stay clearly separated from existing
 * /api/instructor and /api/admin endpoints. Permission checks are performed
 * here, never only in the React UI.
 */
@RestController
@RequestMapping("/api/hod")
@CrossOrigin(origins = "*")
public class HODController {

    private final HODService hodService;
    private final InstructorCourseAssignmentRepository assignmentRepository;
    private final UserRepository users;

    public HODController(
            HODService hodService,
            InstructorCourseAssignmentRepository assignmentRepository,
            UserRepository users) {

        this.hodService = hodService;
        this.assignmentRepository = assignmentRepository;
        this.users = users;
    }

    // =========================
    // DASHBOARD (LEVEL 1)
    // =========================

    @GetMapping("/dashboard")
    public HODDashboardView getDashboard(Authentication authentication) {
        requireHOD(authentication);
        return hodService.getDashboard();
    }

    // =========================
    // INSTRUCTOR ASSIGNMENT LIST (SECTION 3)
    // =========================

    /** Return the full assignment table: Subject/Course | Assigned Instructor | Status | Action */
    @GetMapping("/assignments")
    public java.util.List<HODAssignmentView> getAssignments(Authentication authentication) {
        requireHOD(authentication);
        return hodService.getAllAssignments();
    }

    /** Return only assignments for a single instructor (one data point for their row). */
    @GetMapping("/assignments/instructor/{instructorId}")
    public java.util.List<HODAssignmentView> getAssignmentsByInstructor(
            @PathVariable Long instructorId,
            Authentication authentication) {
        requireHOD(authentication);
        return hodService.getAssignmentsByInstructorId(instructorId);
    }

    /** Return only assignments for a single course. */
    @GetMapping("/assignments/course/{courseId}")
    public java.util.List<HODAssignmentView> getAssignmentsByCourse(
            @PathVariable Long courseId,
            Authentication authentication) {
        requireHOD(authentication);
        return hodService.getAssignmentsByCourseId(courseId);
    }

    // =========================
    // ASSIGN INSTRUCTOR TO COURSE (SECTION 3)
    // =========================

    @PostMapping("/assignments")
    public InstructorCourseAssignment createAssignment(
            Authentication authentication,
            @RequestBody HODRequest request) {
        requireHOD(authentication);
        if (request.getInstructorId() == null || request.getCourseId() == null) {
            throw new RuntimeException("Instructor ID and Course ID are required");
        }
        return hodService.createAssignment(request);
    }

    // =========================
    // CHANGE/UPDATE INSTRUCTOR ASSIGNMENT (SECTION 3)
    // =========================

    @PutMapping("/assignments/{id}")
    public InstructorCourseAssignment editAssignment(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody HODRequest request) {
        requireHOD(authentication);
        return hodService.updateAssignment(id, request);
    }

    // =========================
    // REMOVE INSTRUCTOR FROM SUBJECT/COURSE (SECTION 3)
    // =========================

    @DeleteMapping("/assignments/instructor/{instructorId}/subject/{subjectId}")
    public ResponseEntity<Map<String, String>> removeInstructorFromSubject(
            Authentication authentication,
            @PathVariable Long instructorId,
            @PathVariable Long subjectId) {
        requireHOD(authentication);
        if (instructorId == null || subjectId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Instructor ID and Subject ID are required"));
        }
        hodService.deleteAssignment(instructorId, subjectId);
        return ResponseEntity.ok(Map.of("message", "Instructor removed from subject"));
    }

    // =========================
    // COMMON HELPERS
    // =========================

    private User me(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Authentication required");
        }
        return users.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private boolean isHOD(Authentication authentication) {
        User user = me(authentication);
        return user.getRole() == Role.HOD;
    }

    private void requireHOD(Authentication authentication) {
        if (!isHOD(authentication)) {
            throw new AccessDeniedException("HOD access required");
        }
    }

    private User getUser(Authentication authentication) {
        return me(authentication);
    }
}
