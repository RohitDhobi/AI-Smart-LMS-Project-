package com.aismartlms.backend.controller;

import com.aismartlms.backend.entity.Enrollment;
import com.aismartlms.backend.service.EnrollmentService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
@CrossOrigin(origins = "*")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    public EnrollmentController(EnrollmentService enrollmentService) {
        this.enrollmentService = enrollmentService;
    }

    // =========================
    // ENROLL USER IN COURSE
    // =========================

    @PostMapping
    public ResponseEntity<Enrollment> enrollUser(
            @RequestParam Long courseId,
            Authentication authentication) {

        String email = authentication.getName();

        Enrollment enrollment =
                enrollmentService.enrollUser(email, courseId);

        return ResponseEntity.ok(enrollment);
    }

    // =========================
    // GET MY ENROLLMENTS
    // =========================

    @GetMapping("/my")
    public ResponseEntity<List<Enrollment>> getMyEnrollments(
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                enrollmentService.getUserEnrollments(email)
        );
    }
}