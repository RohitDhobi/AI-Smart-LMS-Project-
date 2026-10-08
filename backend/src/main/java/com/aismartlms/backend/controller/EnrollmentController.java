package com.aismartlms.backend.controller;

import com.aismartlms.backend.entity.Enrollment;
import com.aismartlms.backend.entity.Role;
import com.aismartlms.backend.entity.User;
import com.aismartlms.backend.exception.AccessDeniedException;
import com.aismartlms.backend.repository.UserRepository;
import com.aismartlms.backend.service.EnrollmentService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/enrollments")
@CrossOrigin(origins = "*")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;
    private final UserRepository users;

    public EnrollmentController(
            EnrollmentService enrollmentService,
            UserRepository users) {
        this.enrollmentService = enrollmentService;
        this.users = users;
    }

    // =========================================================
    // COMMON HELPERS (same convention as CourseManagementController)
    // =========================================================

    private User me(Authentication authentication) {

        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Authentication required");
        }

        return users.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private void requireRole(User user, Role... allowedRoles) {

        for (Role allowedRole : allowedRoles) {

            if (user.getRole() == allowedRole) {
                return;
            }
        }

        throw new AccessDeniedException("Admin access required");
    }

    // =========================================================
    // SELF-SERVICE (any authenticated user)
    // =========================================================

    // ENROLL SELF IN A COURSE
    @PostMapping
    public ResponseEntity<Enrollment> enrollUser(
            @RequestParam Long courseId,
            Authentication authentication) {

        Enrollment enrollment =
                enrollmentService.enrollUser(
                        authentication.getName(),
                        courseId
                );

        return ResponseEntity.ok(enrollment);
    }

    // UNENROLL SELF FROM A COURSE
    @DeleteMapping
    public ResponseEntity<Map<String, Object>> unenrollUser(
            @RequestParam Long courseId,
            Authentication authentication) {

        enrollmentService.unenrollUser(
                authentication.getName(),
                courseId
        );

        return ResponseEntity.ok(
                Map.of("message", "Unenrolled successfully")
        );
    }

    // GET MY ENROLLMENTS
    @GetMapping("/my")
    public ResponseEntity<List<Enrollment>> getMyEnrollments(
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                enrollmentService.getUserEnrollments(email)
        );
    }

    // =========================================================
    // MANAGEMENT (ADMIN or HOD only)
    // =========================================================

    // ALL ENROLLMENTS - powers the management page
    @GetMapping("/all")
    public ResponseEntity<List<Enrollment>> getAllEnrollments(
            Authentication authentication) {

        requireRole(me(authentication), Role.ADMIN, Role.HOD);

        return ResponseEntity.ok(
                enrollmentService.getAllEnrollments()
        );
    }

    // ENROLL A STUDENT INTO A COURSE (staff action)
    @PostMapping("/manage")
    public ResponseEntity<Enrollment> manageEnroll(
            @RequestParam Long studentId,
            @RequestParam Long courseId,
            Authentication authentication) {

        requireRole(me(authentication), Role.ADMIN, Role.HOD);

        Enrollment enrollment =
                enrollmentService.enrollStudent(studentId, courseId);

        return ResponseEntity.ok(enrollment);
    }

    // REMOVE AN ENROLLMENT (staff action, by enrollment id)
    @DeleteMapping("/manage/{id}")
    public ResponseEntity<Map<String, Object>> manageRemove(
            @PathVariable Long id,
            Authentication authentication) {

        requireRole(me(authentication), Role.ADMIN, Role.HOD);

        enrollmentService.removeStudentEnrollment(id);

        return ResponseEntity.ok(
                Map.of("message", "Enrollment removed")
        );
    }
}
